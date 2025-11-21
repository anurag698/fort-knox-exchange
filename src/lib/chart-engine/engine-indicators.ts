import { IChartApi, ISeriesApi } from "lightweight-charts";
import { ChartEngine, Candle } from "./engine-core";

export class IndicatorManager {
    private chart: IChartApi;
    private engine: ChartEngine;
    private activeIndicators: Map<string, ISeriesApi<"Line">> = new Map();

    constructor(chart: IChartApi, engine: ChartEngine) {
        this.chart = chart;
        this.engine = engine;
    }

    destroy() {
        this.activeIndicators.forEach((series) => {
            this.chart.removeSeries(series);
        });
        this.activeIndicators.clear();
    }

    addSMA(period: number, color: string) {
        const id = `SMA_${period}`;
        if (this.activeIndicators.has(id)) return;

        const series = this.chart.addLineSeries({
            color: color,
            lineWidth: 2,
            title: `SMA ${period}`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        const data = this.calculateSMA(this.engine.candles, period);
        series.setData(data);

        this.activeIndicators.set(id, series);
    }

    removeSMA(period: number) {
        this.removeIndicator(`SMA_${period}`);
    }

    removeIndicator(id: string) {
        const series = this.activeIndicators.get(id);
        if (series) {
            this.chart.removeSeries(series);
            this.activeIndicators.delete(id);
        }
    }

    addEMA(period: number, color: string) {
        const id = `EMA_${period}`;
        if (this.activeIndicators.has(id)) return;

        const series = this.chart.addLineSeries({
            color: color,
            lineWidth: 2,
            title: `EMA ${period}`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        const data = this.calculateEMA(this.engine.candles, period);
        series.setData(data);

        this.activeIndicators.set(id, series);
    }

    removeEMA(period: number) {
        this.removeIndicator(`EMA_${period}`);
    }

    removeVWAP(session: string = "today") {
        this.removeIndicator(`VWAP_${session}`);
    }

    addBB(period: number = 20, stdDev: number = 2) {
        const id = `BB_${period}_${stdDev}`;
        if (this.activeIndicators.has(id)) return;

        // Upper band
        const upperSeries = this.chart.addLineSeries({
            color: "#3b82f6", // Blue
            lineWidth: 1,
            title: `BB Upper`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        // Middle band (SMA)
        const middleSeries = this.chart.addLineSeries({
            color: "#6b7280", // Gray
            lineWidth: 1,
            lineStyle: 2, // Dashed
            title: `BB Middle`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        // Lower band
        const lowerSeries = this.chart.addLineSeries({
            color: "#3b82f6", // Blue
            lineWidth: 1,
            title: `BB Lower`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        const { upper, middle, lower } = this.calculateBB(this.engine.candles, period, stdDev);
        upperSeries.setData(upper);
        middleSeries.setData(middle);
        lowerSeries.setData(lower);

        this.activeIndicators.set(`${id}_upper`, upperSeries);
        this.activeIndicators.set(`${id}_middle`, middleSeries);
        this.activeIndicators.set(`${id}_lower`, lowerSeries);
    }

    removeBB(period: number = 20, stdDev: number = 2) {
        const id = `BB_${period}_${stdDev}`;
        this.removeIndicator(`${id}_upper`);
        this.removeIndicator(`${id}_middle`);
        this.removeIndicator(`${id}_lower`);
    }

    addMACD(fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
        const id = `MACD_${fastPeriod}_${slowPeriod}_${signalPeriod}`;
        if (this.activeIndicators.has(id)) return;

        // MACD Line
        const macdSeries = this.chart.addLineSeries({
            color: "#10b981", // Green
            lineWidth: 2,
            title: `MACD`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        // Signal Line
        const signalSeries = this.chart.addLineSeries({
            color: "#ef4444", // Red
            lineWidth: 2,
            title: `Signal`,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        const { macd, signal } = this.calculateMACD(this.engine.candles, fastPeriod, slowPeriod, signalPeriod);
        macdSeries.setData(macd);
        signalSeries.setData(signal);

        this.activeIndicators.set(`${id}_macd`, macdSeries);
        this.activeIndicators.set(`${id}_signal`, signalSeries);
    }

    removeMACD(fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
        const id = `MACD_${fastPeriod}_${slowPeriod}_${signalPeriod}`;
        this.removeIndicator(`${id}_macd`);
        this.removeIndicator(`${id}_signal`);
    }

    addRSI(period: number, panelId: string) {
        console.warn("RSI not implemented yet (requires multi-pane support)");
    }

    addVWAP(session: string) {
        const id = `VWAP_${session}`;
        if (this.activeIndicators.has(id)) return;

        const series = this.chart.addLineSeries({
            color: "#a855f7", // Purple
            lineWidth: 2,
            title: "VWAP",
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        });

        const data = this.calculateVWAP(this.engine.candles);
        series.setData(data);

        this.activeIndicators.set(id, series);
    }

    recalculateAll() {
        // Update all active indicators with latest data
        this.activeIndicators.forEach((series, id) => {
            if (id.startsWith("SMA_")) {
                const period = parseInt(id.split("_")[1]);
                series.setData(this.calculateSMA(this.engine.candles, period));
            } else if (id.startsWith("EMA_")) {
                const period = parseInt(id.split("_")[1]);
                series.setData(this.calculateEMA(this.engine.candles, period));
            } else if (id.startsWith("VWAP")) {
                series.setData(this.calculateVWAP(this.engine.candles));
            } else if (id.includes("BB_") && id.endsWith("_upper")) {
                const [_, period, stdDev] = id.replace("_upper", "").split("_");
                const { upper, middle, lower } = this.calculateBB(this.engine.candles, parseInt(period), parseInt(stdDev));
                series.setData(upper);
                this.activeIndicators.get(id.replace("_upper", "_middle"))?.setData(middle);
                this.activeIndicators.get(id.replace("_upper", "_lower"))?.setData(lower);
            } else if (id.includes("MACD_") && id.endsWith("_macd")) {
                const parts = id.replace("_macd", "").split("_");
                const { macd, signal } = this.calculateMACD(this.engine.candles, parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
                series.setData(macd);
                this.activeIndicators.get(id.replace("_macd", "_signal"))?.setData(signal);
            }
        });
    }

    // -------------------------
    // Math Helpers
    // -------------------------
    private calculateSMA(candles: Candle[], period: number) {
        const result = [];
        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) continue;
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += candles[i - j].c;
            }
            result.push({
                time: Math.floor(candles[i].t / 1000) as any,
                value: sum / period,
            });
        }
        return result;
    }

    private calculateEMA(candles: Candle[], period: number) {
        const result = [];
        const k = 2 / (period + 1);
        let ema = candles[0].c;

        for (let i = 0; i < candles.length; i++) {
            const price = candles[i].c;
            if (i === 0) {
                ema = price;
            } else {
                ema = price * k + ema * (1 - k);
            }

            if (i >= period - 1) {
                result.push({
                    time: Math.floor(candles[i].t / 1000) as any,
                    value: ema,
                });
            }
        }
        return result;
    }

    private calculateVWAP(candles: Candle[]) {
        const result = [];
        let cumVol = 0;
        let cumVolPrice = 0;
        let currentDay = new Date(candles[0].t).getDate();

        for (let i = 0; i < candles.length; i++) {
            const candle = candles[i];
            const day = new Date(candle.t).getDate();

            // Reset on new day (UTC)
            if (day !== currentDay) {
                cumVol = 0;
                cumVolPrice = 0;
                currentDay = day;
            }

            const typicalPrice = (candle.h + candle.l + candle.c) / 3;
            const vol = candle.v;

            cumVol += vol;
            cumVolPrice += typicalPrice * vol;

            if (cumVol > 0) {
                result.push({
                    time: Math.floor(candle.t / 1000) as any,
                    value: cumVolPrice / cumVol,
                });
            }
        }
        return result;
    }

    private calculateBB(candles: Candle[], period: number, stdDev: number) {
        const upper = [];
        const middle = [];
        const lower = [];

        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) continue;

            // Calculate SMA
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += candles[i - j].c;
            }
            const sma = sum / period;

            // Calculate standard deviation
            let variance = 0;
            for (let j = 0; j < period; j++) {
                variance += Math.pow(candles[i - j].c - sma, 2);
            }
            const std = Math.sqrt(variance / period);

            const time = Math.floor(candles[i].t / 1000) as any;

            upper.push({ time, value: sma + stdDev * std });
            middle.push({ time, value: sma });
            lower.push({ time, value: sma - stdDev * std });
        }

        return { upper, middle, lower };
    }

    private calculateMACD(candles: Candle[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
        const macd = [];
        const signal = [];

        // Calculate EMAs
        const fastEMA = this.calculateEMAValues(candles, fastPeriod);
        const slowEMA = this.calculateEMAValues(candles, slowPeriod);

        // MACD line = Fast EMA - Slow EMA
        const macdValues: number[] = [];
        for (let i = slowPeriod - 1; i < candles.length; i++) {
            const macdValue = fastEMA[i] - slowEMA[i];
            macdValues.push(macdValue);

            macd.push({
                time: Math.floor(candles[i].t / 1000) as any,
                value: macdValue,
            });
        }

        // Signal line = EMA of MACD
        const k = 2 / (signalPeriod + 1);
        let signalEMA = macdValues[0];

        for (let i = 0; i < macdValues.length; i++) {
            if (i === 0) {
                signalEMA = macdValues[i];
            } else {
                signalEMA = macdValues[i] * k + signalEMA * (1 - k);
            }

            if (i >= signalPeriod - 1) {
                signal.push({
                    time: Math.floor(candles[slowPeriod - 1 + i].t / 1000) as any,
                    value: signalEMA,
                });
            }
        }

        return { macd, signal };
    }

    private calculateEMAValues(candles: Candle[], period: number): number[] {
        const result: number[] = [];
        const k = 2 / (period + 1);
        let ema = candles[0].c;

        for (let i = 0; i < candles.length; i++) {
            const price = candles[i].c;
            if (i === 0) {
                ema = price;
            } else {
                ema = price * k + ema * (1 - k);
            }
            result.push(ema);
        }
        return result;
    }
}
