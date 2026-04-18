package repository

import (
	"github.com/KinuGra/giraffe-2604/services/functions/model"
	"gorm.io/gorm"
)

type FunctionRepo struct {
	db *gorm.DB
}

func NewFunctionRepo(db *gorm.DB) *FunctionRepo {
	return &FunctionRepo{db: db}
}

func (r *FunctionRepo) Create(f *model.Function) error {
	return r.db.Create(f).Error
}

func (r *FunctionRepo) FindByID(id string) (*model.Function, error) {
	var f model.Function
	if err := r.db.First(&f, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FunctionRepo) FindAll() ([]model.Function, error) {
	var funcs []model.Function
	if err := r.db.Find(&funcs).Error; err != nil {
		return nil, err
	}
	return funcs, nil
}

func (r *FunctionRepo) Delete(id string) error {
	return r.db.Delete(&model.Function{}, "id = ?", id).Error
}

func (r *FunctionRepo) CreateLog(l *model.ExecutionLog) error {
	return r.db.Create(l).Error
}
