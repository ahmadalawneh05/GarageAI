# ⚡ EV Fault Detection — Predicting Electric Vehicle Engine Failures Using Machine Learning

> **Course:** Machine Learning — Term Project  
> **University:** An-Najah National University | Faculty of Engineering & IT | Computer Science  
> **Supervisor:** Dr. Adnan Salman

---

## 📋 Project Overview

This project applies classical machine learning algorithms to predict and classify faults in **New Energy Vehicle (NEV)** drivetrains using real-world sensor data. The system identifies three distinct fault types — Mechanical, Electrical, and Thermal — enabling early detection that can reduce unplanned vehicle downtime by an estimated **30–40%**.

---

## 🎯 Problem Statement

Electric vehicles rely on complex electronic and mechanical systems that can develop faults in real time. Manual inspection is costly and reactive. This project builds a **multi-class fault classifier** that monitors sensor readings and flags fault conditions before they escalate.

| Fault Class | Inferred Type | Key Sensor Signature |
|---|---|---|
| Fault-0 | Normal Operation | Baseline readings |
| Fault-1 | Mechanical Fault | Vibration ×2.34, RPM −38% |
| Fault-2 | Electrical Fault | Voltage −30%, Current −46% |
| Fault-3 | Thermal Fault | Temperature ×2.04, Voltage −50% |

---

## 📊 Dataset

**NEV Fault Diagnosis Dataset** — sourced from Kaggle

> 📎 [Fault Diagnosis Dataset for New Energy Vehicles — Kaggle](https://www.kaggle.com/datasets/ziya07/fault-diagnosis-dataset-for-new-energy-vehicles)

- **Features (7 sensors):** Voltage (V), Current (A), Motor RPM, Temperature (°C), Vibration (g), Ambient Temperature (°C), Humidity (%)
- **Target:** Fault Label (0 = Normal, 1 = Mechanical, 2 = Electrical, 3 = Thermal)
- **Preprocessing:** Outlier removal at 99.9th percentile, StandardScaler normalization (fit on train only to prevent leakage)

---

## 🤖 Models Compared

| Model | Accuracy | F1-Macro | CV-5 Mean |
|---|---|---|---|
| **Random Forest** ⭐ | **91.85%** | **~0.91** | **Best** |
| Extra Trees | ~91% | ~0.90 | — |
| Decision Tree | ~88% | ~0.87 | — |
| AdaBoost | ~85% | ~0.84 | — |
| K-Nearest Neighbors | ~75% | ~0.74 | — |
| Logistic Regression | ~65% | ~0.63 | — |
| MLP Neural Network | 78.31% | 0.7526 | (test only) |

> **Best Model:** Random Forest with GridSearchCV tuning (`n_estimators=150`, `max_depth=15`) → **91.95% accuracy**

---

## 🔑 Key Findings

1. **Tree-based models dominate** — PCA confirms data is NOT linearly separable, making Logistic Regression structurally limited
2. **Random Forest achieves 91.85%** accuracy on the held-out test set
3. **Neural Network (MLP) underperforms** classical tree models on this tabular dataset (78.31%)
4. **Optimal Decision Tree depth ≈ 8** — significant overfitting observed beyond depth 10
5. **Learning curves** show CV score improves with more data — model benefits from larger samples
6. **All 7 principal components** needed to capture 100% variance — confirming this is a high-dimensional, non-linear problem

---

## 📁 Repository Structure

```
EV-Fault-Detection/
│
├── car.ipynb                    # Main notebook (full analysis)
├── NEV_fault_dataset_new.csv    # Dataset (from Kaggle)
├── machine-report.pdf           # Full project report
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/EV-Fault-Detection.git
cd EV-Fault-Detection
```

### 2. Install dependencies
```bash
pip install numpy pandas matplotlib seaborn scikit-learn scipy
```

### 3. Download the dataset
Download `NEV_fault_dataset_new.csv` from [Kaggle](https://www.kaggle.com/datasets/ziya07/fault-diagnosis-dataset-for-new-energy-vehicles) and place it in the project root directory.

### 4. Run the notebook
```bash
jupyter notebook car.ipynb
```

---

## 📈 Visualizations Generated

The notebook produces **12 figures** saved as PNG files:

| Figure | Description |
|---|---|
| `fig1_class_distribution.png` | Bar chart + pie chart of class balance |
| `fig2_feature_distributions.png` | KDE curves per fault type (7 features) |
| `fig3_correlation_heatmap.png` | Feature correlation matrix |
| `fig4_boxplots.png` | Boxplots per fault class |
| `fig5–fig8` | Confusion matrices for top models |
| `fig9_learning_curve.png` | Random Forest learning curve |
| `fig10_pca_analysis.png` | 2D PCA scatter + scree plot |
| `fig11_dt_overfitting.png` | Decision Tree depth vs accuracy |
| `fig12_fault_profiles.png` | Fault sensor profiles (ratio to normal) |

---

## 🛠️ Tech Stack

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.x-F7931E?style=flat&logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat&logo=numpy&logoColor=white)
![Matplotlib](https://img.shields.io/badge/Matplotlib-11557C?style=flat)
![Jupyter](https://img.shields.io/badge/Jupyter-F37626?style=flat&logo=jupyter&logoColor=white)

---

## 📌 Practical Implications

| Alert Type | Recommended Action |
|---|---|
| 🔧 Mechanical Fault | Schedule bearing/rotor inspection immediately |
| ⚡ Electrical Fault | Check inverter and power electronics |
| 🌡️ Thermal Fault | Inspect cooling system — **critical priority** |

Early fault detection can reduce unplanned EV downtime by an estimated **30–40%**.

---

## 📄 License

This project is submitted as an academic course requirement. Dataset is publicly available on Kaggle under its original license.
