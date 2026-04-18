"""
Claude Code Review via Amazon Bedrock (Claude Opus 4.6).

Reads a PR diff from stdin, sends it to Claude for review,
and posts the review as a PR comment using the gh CLI.
"""

import json
import os
import subprocess
import sys

import boto3

MODEL_ID = "us.anthropic.claude-opus-4-6-v1"
# Bedrock input limit is large, but we cap the diff to stay well within
# token limits and keep reviews focused.
MAX_DIFF_CHARS = 120_000

REVIEW_PROMPT = """\
You are an expert code reviewer. Review the following pull request diff and provide \
actionable feedback. Focus on:

1. **Bugs** - Logic errors, off-by-one mistakes, null/nil dereferences, race conditions
2. **Security** - Injection flaws, credential leaks, insecure defaults, missing auth checks
3. **Performance** - Unnecessary allocations, N+1 queries, missing indexes, blocking calls
4. **Code style** - Readability, naming, dead code, overly complex logic
5. **Improvements** - Simpler alternatives, missing error handling, better abstractions

Rules:
- Be concise. Only comment on things that matter.
- If the diff looks good, say so briefly.
- Format your response in Markdown suitable for a GitHub PR comment.
- Do NOT repeat the diff back. Reference files and line numbers when relevant.
- Start with a short summary, then list findings (if any).

Diff:
```
{diff}
```
"""


def get_diff() -> str:
    """Read the PR diff from stdin."""
    diff = sys.stdin.read()
    if not diff.strip():
        print("No diff provided on stdin.", file=sys.stderr)
        sys.exit(1)
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n... (diff truncated due to size)\n"
    return diff


def call_bedrock(diff: str) -> str:
    """Invoke Claude Opus 4.6 via Amazon Bedrock and return the review text."""
    region = os.environ.get("AWS_REGION", "us-east-1")
    client = boto3.client("bedrock-runtime", region_name=region)

    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": REVIEW_PROMPT.format(diff=diff),
                }
            ],
        }
    )

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=body,
    )

    result = json.loads(response["body"].read())
    # Bedrock Messages API returns {"content": [{"type": "text", "text": "..."}]}
    return result["content"][0]["text"]


def post_review(review_text: str) -> None:
    """Post the review as a PR comment using the gh CLI."""
    pr_number = os.environ["PR_NUMBER"]
    repo = os.environ["REPO"]

    header = "## Claude Code Review\n\n"
    footer = "\n\n---\n*Automated review by Claude Opus 4.6 via Amazon Bedrock*"
    body = header + review_text + footer

    subprocess.run(
        [
            "gh", "pr", "comment", pr_number,
            "--repo", repo,
            "--body", body,
        ],
        check=True,
    )


def main() -> None:
    diff = get_diff()
    print(f"Diff size: {len(diff)} characters")

    print("Calling Claude via Bedrock...")
    review = call_bedrock(diff)

    print("Posting review comment...")
    post_review(review)
    print("Done.")


if __name__ == "__main__":
    main()
