"use strict";

console.log('Chart.js loaded (helper)');

window.reinitCharts = function() {
    if (window.App) {
        console.log('Re-initializing charts...');
        window.App.initEquityChart();
        window.App.updateAnalytics();
        if (window.App.performanceCharts) {
            window.App.initPerfEquityChart();
            window.App.initPerfMonthlyChart();
            window.App.initPerfSessionsChart();
        }
        if (window.App.guardianCharts) {
            window.App.initRiskChart();
        }
    }
};