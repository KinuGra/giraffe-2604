# serverless-functional Kubernetes デプロイ設計書

## 概要

serverless-functions をクライアントが利用できるようにするため、Node.js ランタイムを含むコンテナイメージを EKS 上に展開する。

## 前提条件

- **インフラ**: AWS EKS を使用（コントロールプレーンはマネージド、設定不要）
- **対象ファイル**: `manifester/serverless-functional/k8s.yml`
- **レプリカ数**: 30 Pod
- **リージョン**: ap-northeast-1（東京）
- **AZ**: ap-northeast-1a, ap-northeast-1c, ap-northeast-1d

## アーキテクチャ

```
                         ap-northeast-1
        ┌──────────────────┬──────────────────┬──────────────────┐
        │   AZ: 1a         │   AZ: 1c         │   AZ: 1d         │
        │                  │                  │                  │
        │  Pod 1..10       │  Pod 11..20      │  Pod 21..30      │
        │  (10 replicas)   │  (10 replicas)   │  (10 replicas)   │
        │                  │                  │                  │
        │  r8i.metal-96xl  │  r8i.metal-96xl  │  r8i.metal-96xl  │
        └──────────────────┴──────────────────┴──────────────────┘
                              │
                              ▼
                     Service (ClusterIP)
                              │
                              ▼
                           Client
```

## Kubernetes リソース構成

### 1. Deployment

| 項目 | 値 |
|------|-----|
| 名前 | serverless-functional |
| Namespace | serverless |
| レプリカ数 | 30 |
| コンテナイメージ | node:22-alpine |
| コンテナポート | 3000 |
| リソース requests | CPU: 100m, Memory: 128Mi |
| リソース limits | CPU: 500m, Memory: 512Mi |
| インスタンスタイプ | r8i.metal-96xl（nodeSelector で指定） |

- **ローリングアップデート戦略**: maxSurge=5, maxUnavailable=3（30 Pod の段階的更新に適した値）
- **ヘルスチェック**:
  - livenessProbe: HTTP GET /health（Pod の生存確認）
  - readinessProbe: HTTP GET /ready（トラフィック受付可否の確認）
- **AZ 均等分散**: topologySpreadConstraints で 3 AZ に 10 Pod ずつ配置
- **ノード指定**: nodeSelector で r8i.metal-96xl インスタンスタイプに限定

### 2. topologySpreadConstraints

| 項目 | 値 |
|------|-----|
| maxSkew | 1 |
| topologyKey | topology.kubernetes.io/zone |
| whenUnsatisfiable | DoNotSchedule |

- 各 AZ (ap-northeast-1a, 1c, 1d) に均等に 10 Pod ずつ配置
- maxSkew=1 により AZ 間の Pod 数差を最大 1 に制限
- DoNotSchedule により均等配置できない場合はスケジューリングを拒否

### 3. nodeSelector

| 項目 | 値 |
|------|-----|
| node.kubernetes.io/instance-type | r8i.metal-96xl |

- r8i.metal-96xl インスタンスタイプのノードにのみ Pod をスケジューリング
- 384 vCPU / 3,072 GiB メモリ / 100 Gbps ネットワーク

### 4. Service (ClusterIP)

| 項目 | 値 |
|------|-----|
| 名前 | serverless-functional |
| Namespace | serverless |
| タイプ | ClusterIP |
| ポート | 80 → 3000 |

- クラスタ内部からのアクセスを想定（gateway サービス等から呼び出される）
- 外部公開が必要な場合は別途 Ingress または LoadBalancer を追加

### 5. Namespace

| 項目 | 値 |
|------|-----|
| 名前 | serverless |

- serverless 関連リソースを分離するための専用 Namespace

## 設計判断

1. **ClusterIP を選択した理由**: 既存アーキテクチャでは gateway が外部トラフィックの入口となっているため、serverless-functional はクラスタ内部通信で十分
2. **node:22-alpine を選択した理由**: 軽量かつ LTS に近い安定バージョン、セキュリティパッチの適用が容易
3. **30 Pod のローリングアップデート**: maxSurge=5 で段階的にデプロイし、maxUnavailable=3 で最低 27 Pod の稼働を維持
4. **Namespace 分離**: 既存の gateway/functions サービスとの責務境界を明確化
5. **topologySpreadConstraints**: AZ 均等分散により高可用性を確保。1 AZ 障害時でも 20 Pod で継続稼働可能
6. **r8i.metal-96xl インスタンス指定**: 東京リージョン全3AZで利用可能な最高スペック（384 vCPU / 3,072 GiB RAM / 100 Gbps）。nodeSelector により該当ノードに限定
