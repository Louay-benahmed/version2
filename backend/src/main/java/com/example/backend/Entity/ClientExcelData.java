package com.example.backend.Entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class ClientExcelData {
    // Q1 (Jan-Mar)
    private String janStatus;
    private String febStatus;
    private String marStatus;
    private Integer q1BcCount;
    private String q1PaymentStatus;
    private Double q1Amount;

    // Q2 (Apr-Jun)
    private String aprStatus;
    private String mayStatus;
    private String junStatus;
    private Integer q2BcCount;
    private String q2PaymentStatus;
    private Double q2Amount;

    // Q3 (Jul-Sep)
    private String julStatus;
    private String augStatus;
    private String sepStatus;
    private Integer q3BcCount;
    private String q3PaymentStatus;
    private Double q3Amount;

    // Q4 (Oct-Dec)
    private String octStatus;
    private String novStatus;
    private String decStatus;
    private Integer q4BcCount;
    private String q4PaymentStatus;
    private Double q4Amount;

    // Financial data
    private Double poids;
    private Double globalAmount;
    private Double annualPayment;
    private Double monthlyPayment;



    public String getJanStatus() {
        return janStatus;
    }

    public void setJanStatus(String janStatus) {
        this.janStatus = janStatus;
    }

    public String getFebStatus() {
        return febStatus;
    }

    public void setFebStatus(String febStatus) {
        this.febStatus = febStatus;
    }

    public String getMarStatus() {
        return marStatus;
    }

    public void setMarStatus(String marStatus) {
        this.marStatus = marStatus;
    }

    public Integer getQ1BcCount() {
        return q1BcCount;
    }

    public void setQ1BcCount(Integer q1BcCount) {
        this.q1BcCount = q1BcCount;
    }

    public String getQ1PaymentStatus() {
        return q1PaymentStatus;
    }

    public void setQ1PaymentStatus(String q1PaymentStatus) {
        this.q1PaymentStatus = q1PaymentStatus;
    }

    public Double getQ1Amount() {
        return q1Amount;
    }

    public void setQ1Amount(Double q1Amount) {
        this.q1Amount = q1Amount;
    }

    public String getAprStatus() {
        return aprStatus;
    }

    public void setAprStatus(String aprStatus) {
        this.aprStatus = aprStatus;
    }

    public String getMayStatus() {
        return mayStatus;
    }

    public void setMayStatus(String mayStatus) {
        this.mayStatus = mayStatus;
    }

    public String getJunStatus() {
        return junStatus;
    }

    public void setJunStatus(String junStatus) {
        this.junStatus = junStatus;
    }

    public Integer getQ2BcCount() {
        return q2BcCount;
    }

    public void setQ2BcCount(Integer q2BcCount) {
        this.q2BcCount = q2BcCount;
    }

    public String getQ2PaymentStatus() {
        return q2PaymentStatus;
    }

    public void setQ2PaymentStatus(String q2PaymentStatus) {
        this.q2PaymentStatus = q2PaymentStatus;
    }

    public Double getQ2Amount() {
        return q2Amount;
    }

    public void setQ2Amount(Double q2Amount) {
        this.q2Amount = q2Amount;
    }

    public String getJulStatus() {
        return julStatus;
    }

    public void setJulStatus(String julStatus) {
        this.julStatus = julStatus;
    }

    public String getAugStatus() {
        return augStatus;
    }

    public void setAugStatus(String augStatus) {
        this.augStatus = augStatus;
    }

    public String getSepStatus() {
        return sepStatus;
    }

    public void setSepStatus(String sepStatus) {
        this.sepStatus = sepStatus;
    }

    public Integer getQ3BcCount() {
        return q3BcCount;
    }

    public void setQ3BcCount(Integer q3BcCount) {
        this.q3BcCount = q3BcCount;
    }

    public String getQ3PaymentStatus() {
        return q3PaymentStatus;
    }

    public void setQ3PaymentStatus(String q3PaymentStatus) {
        this.q3PaymentStatus = q3PaymentStatus;
    }

    public Double getQ3Amount() {
        return q3Amount;
    }

    public void setQ3Amount(Double q3Amount) {
        this.q3Amount = q3Amount;
    }

    public String getOctStatus() {
        return octStatus;
    }

    public void setOctStatus(String octStatus) {
        this.octStatus = octStatus;
    }

    public String getNovStatus() {
        return novStatus;
    }

    public void setNovStatus(String novStatus) {
        this.novStatus = novStatus;
    }

    public String getDecStatus() {
        return decStatus;
    }

    public void setDecStatus(String decStatus) {
        this.decStatus = decStatus;
    }

    public Integer getQ4BcCount() {
        return q4BcCount;
    }

    public void setQ4BcCount(Integer q4BcCount) {
        this.q4BcCount = q4BcCount;
    }

    public String getQ4PaymentStatus() {
        return q4PaymentStatus;
    }

    public void setQ4PaymentStatus(String q4PaymentStatus) {
        this.q4PaymentStatus = q4PaymentStatus;
    }

    public Double getQ4Amount() {
        return q4Amount;
    }

    public void setQ4Amount(Double q4Amount) {
        this.q4Amount = q4Amount;
    }

    public Double getPoids() {
        return poids;
    }

    public void setPoids(Double poids) {
        this.poids = poids;
    }

    public Double getGlobalAmount() {
        return globalAmount;
    }

    public void setGlobalAmount(Double globalAmount) {
        this.globalAmount = globalAmount;
    }

    public Double getAnnualPayment() {
        return annualPayment;
    }

    public void setAnnualPayment(Double annualPayment) {
        this.annualPayment = annualPayment;
    }

    public Double getMonthlyPayment() {
        return monthlyPayment;
    }

    public void setMonthlyPayment(Double monthlyPayment) {
        this.monthlyPayment = monthlyPayment;
    }
}
