import { IChartApi, MouseEventParams } from "lightweight-charts";
import { ChartEngine } from "./engine-core";

export type DrawingTool = "trend" | "horizontal" | "fib" | "ray" | "measure";

export class DrawingManager {
    private chart: IChartApi;
    private engine: ChartEngine;
    private isDrawing = false;
    private activeTool: DrawingTool | null = null;
    private currentDrawing: any = null;
    private drawings: any[] = [];
    private magnetEnabled = false;
    public selectedDrawingIndex: number | null = null;
    private dragTarget: { drawingIndex: number; pointIndex: number; offset?: { time: number; price: number } } | null = null;
    private dragOrigin: { time: number, price: number } | null = null;
    private dragDrawingInitialState: any = null;
    private isDragging = false;

    constructor(chart: IChartApi, engine: ChartEngine) {
        this.chart = chart;
        this.engine = engine;
        this.setupEventListeners();
    }

    destroy() {
        this.chart.unsubscribeClick(this.handleClick);
        this.chart.unsubscribeCrosshairMove(this.handleMove);
        if (this.engine.container) {
            this.engine.container.removeEventListener("mousedown", this.handleMouseDown);
            window.removeEventListener("mouseup", this.handleMouseUp);
        }
    }

    private setupEventListeners() {
        this.chart.subscribeClick(this.handleClick);
        this.chart.subscribeCrosshairMove(this.handleMove);

        // Native listeners for drag
        if (this.engine.container) {
            this.engine.container.addEventListener("mousedown", this.handleMouseDown);
            window.addEventListener("mouseup", this.handleMouseUp);
        }
    }

    private handleMouseDown = (e: MouseEvent) => {
        if (this.activeTool) return; // Don't drag while drawing tool is active

        // We need to map client coordinates to chart coordinates
        // But we can't easily get 'time' from clientX without the chart API's help
        // However, we can use the last known crosshair position if we track it?
        // Or we can just use the hit test logic which we already have, but we need to know WHICH point.

        // Actually, we can rely on the fact that handleMove updates 'lastParam' or similar?
        // No, let's just use the hit test logic again but return more info.

        // We need to know if we hit a handle (p1 or p2) or the line.
        // Since we don't have 'param' here (it's a native event), we need to convert e.clientX/Y
        // to chart coordinates. This is tricky without the chart API exposing 'coordinateToTime' for raw pixels.
        // BUT, we can use the chart's container bounds.

        const rect = this.engine.container!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // We need 'time' for hit testing. 
        // We can use chart.timeScale().coordinateToTime(x)
        const time = this.chart.timeScale().coordinateToTime(x);

        if (!time) return;

        // Hit test
        const hit = this.hitTest(time as number, y); // We need a better hit test that returns point index

        if (hit) {
            this.isDragging = true;
            this.dragTarget = hit;
            this.selectedDrawingIndex = hit.drawingIndex;
            this.engine.selectedDrawingIndex = hit.drawingIndex;
            this.engine.eventBus.emit("drawing-update");
            // Prevent default to avoid text selection etc
            e.preventDefault();
        }
    };

    private handleMouseUp = () => {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragTarget = null;
            this.engine.eventBus.emit("drawing-update");
        }
    };

    // Enhanced hit test
    private hitTest(time: number, y: number): { drawingIndex: number; pointIndex: number } | null {
        // pointIndex: 0 = p1, 1 = p2, -1 = body (move whole shape)
        const PIXEL_THRESHOLD = 10;

        for (let i = this.engine.drawings.length - 1; i >= 0; i--) {
            const d = this.engine.drawings[i];

            // Check handles first (priority)
            const p1 = d.p1 || d.high;
            const p2 = d.p2 || d.low;

            if (p1) {
                const x1 = this.chart.timeScale().timeToCoordinate(p1.time as any);
                const y1 = this.engine.candleSeries?.priceToCoordinate(p1.price);
                if (x1 !== null && y1 !== null && y1 !== undefined) {
                    const cursorX = this.chart.timeScale().timeToCoordinate(time as any);
                    if (cursorX !== null) {
                        const dist = Math.sqrt(Math.pow(cursorX - x1, 2) + Math.pow(y - y1, 2));
                        if (dist < PIXEL_THRESHOLD) return { drawingIndex: i, pointIndex: 0 };
                    }
                }
            }

            if (p2) {
                const x2 = this.chart.timeScale().timeToCoordinate(p2.time as any);
                const y2 = this.engine.candleSeries?.priceToCoordinate(p2.price);
                if (x2 !== null && y2 !== null && y2 !== undefined) {
                    const cursorX = this.chart.timeScale().timeToCoordinate(time as any);
                    if (cursorX !== null) {
                        const dist = Math.sqrt(Math.pow(cursorX - x2, 2) + Math.pow(y - y2, 2));
                        if (dist < PIXEL_THRESHOLD) return { drawingIndex: i, pointIndex: 1 };
                    }
                }
            }

            // Check body (if no handle hit)
            if (d.type === 'trend' || d.type === 'fib' || d.type === 'ray' || d.type === 'measure') {
                const p1 = d.p1 || d.high;
                const p2 = d.p2 || d.low;
                if (p1 && p2) {
                    const x1 = this.chart.timeScale().timeToCoordinate(p1.time as any);
                    const y1 = this.engine.candleSeries?.priceToCoordinate(p1.price);
                    const x2 = this.chart.timeScale().timeToCoordinate(p2.time as any);
                    const y2 = this.engine.candleSeries?.priceToCoordinate(p2.price);

                    if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
                        // Point to segment distance
                        const cursorX = this.chart.timeScale().timeToCoordinate(time as any);
                        if (cursorX !== null) {
                            const dist = this.pointToSegmentDistance(cursorX, y, x1, y1, x2, y2);
                            if (dist < PIXEL_THRESHOLD) return { drawingIndex: i, pointIndex: -1 };
                        }
                    }
                }
            } else if (d.type === 'horizontal') {
                const drawingY = this.engine.candleSeries?.priceToCoordinate(d.price);
                if (drawingY !== null && drawingY !== undefined && Math.abs(drawingY - y) < PIXEL_THRESHOLD) {
                    return { drawingIndex: i, pointIndex: -1 };
                }
            }
        }

        return null;
    }

    toggleMagnet() {
        this.magnetEnabled = !this.magnetEnabled;
        console.log("Magnet mode:", this.magnetEnabled);
        return this.magnetEnabled;
    }

    deleteSelectedDrawing() {
        if (this.selectedDrawingIndex !== null && this.engine.drawings[this.selectedDrawingIndex]) {
            this.engine.drawings.splice(this.selectedDrawingIndex, 1);
            this.selectedDrawingIndex = null;
            this.engine.selectedDrawingIndex = null; // Sync
            this.engine.eventBus.emit("drawing-update");
        }
    }

    private snapToCandle(time: any, price: number): number {
        if (!this.magnetEnabled || !this.engine.candles.length) return price;

        // Find candle matching time
        // Since candles are sorted by time, we could binary search, but find is okay for now
        // Time from LC is in seconds (unix timestamp / 1000)
        const candle = this.engine.candles.find(c => Math.floor(c.t / 1000) === time);

        if (!candle) return price;

        // Find nearest OHLC value
        const values = [candle.o, candle.h, candle.l, candle.c];
        const nearest = values.reduce((prev, curr) => {
            return (Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev);
        });

        // Snap if within reasonable distance (e.g. 5% of price? No, just snap to nearest)
        // Or maybe only snap if close enough? For now, hard snap to nearest OHLC
        return nearest;
    }

    private getDrawingAtPoint(param: MouseEventParams): number | null {
        if (!param.point || !this.engine.candleSeries) return null;

        const price = this.engine.candleSeries.coordinateToPrice(param.point.y) as number;
        const time = param.time; // This might be null in empty space
        const x = param.point.x;
        const y = param.point.y;

        // Thresholds (in pixels for X/Y, in price for horizontal)
        const PIXEL_THRESHOLD = 10;

        // We need to convert drawing points to screen coordinates for accurate hit testing
        // But we don't have easy access to timeToCoordinate here without the chart instance
        // We can use the chart instance we have.

        for (let i = this.engine.drawings.length - 1; i >= 0; i--) {
            const d = this.engine.drawings[i];

            if (d.type === 'horizontal') {
                // Check price distance
                // Convert drawing price to Y
                const drawingY = this.engine.candleSeries.priceToCoordinate(d.price);
                if (drawingY !== null && Math.abs(drawingY - y) < PIXEL_THRESHOLD) {
                    return i;
                }
            } else if (d.type === 'trend' || d.type === 'fib' || d.type === 'ray') {
                // Need to convert both points to screen coords
                const p1Time = d.p1.time || d.high?.time; // Handle fib structure if different
                const p1Price = d.p1.price || d.high?.price;
                const p2Time = d.p2.time || d.low?.time;
                const p2Price = d.p2.price || d.low?.price;

                const x1 = this.chart.timeScale().timeToCoordinate(p1Time);
                const y1 = this.engine.candleSeries.priceToCoordinate(p1Price);
                const x2 = this.chart.timeScale().timeToCoordinate(p2Time);
                const y2 = this.engine.candleSeries.priceToCoordinate(p2Price);

                if (x1 === null || y1 === null || x2 === null || y2 === null) continue;

                // Distance from point (x,y) to line segment (x1,y1)-(x2,y2)
                const dist = this.pointToSegmentDistance(x, y, x1, y1, x2, y2);
                if (dist < PIXEL_THRESHOLD) {
                    return i;
                }
            }
        }
        return null;
    }

    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) // in case of 0 length line
            param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private handleClick = (param: MouseEventParams) => {
        // If no active tool, try to select a drawing
        if (!this.activeTool) {
            const index = this.getDrawingAtPoint(param);
            if (index !== null) {
                this.selectedDrawingIndex = index;
                this.engine.selectedDrawingIndex = index; // Sync to engine
                console.log("Selected drawing:", index);
                this.engine.eventBus.emit("drawing-update");
                return; // Consumed click
            } else {
                // Deselect if clicking empty space
                if (this.selectedDrawingIndex !== null) {
                    this.selectedDrawingIndex = null;
                    this.engine.selectedDrawingIndex = null; // Sync to engine
                    this.engine.eventBus.emit("drawing-update");
                }
            }
            return;
        }

        if (!this.activeTool || !param.point) return;

        // Use coordinateToPrice for precise placement at cursor Y position
        let price = this.engine.candleSeries?.coordinateToPrice(param.point.y) as number;

        // Resolve time if missing (e.g. clicking in empty space)
        let time = param.time;
        if (!time && param.point) {
            const t = this.chart.timeScale().coordinateToTime(param.point.x);
            if (t !== null) time = t;
        }

        if (price === null || price === undefined) return;

        // Apply Magnet Snap if enabled and we have time
        if (this.magnetEnabled && time) {
            price = this.snapToCandle(time, price);
        }

        if (this.activeTool === "horizontal") {
            // Horizontal line is instant (one click)
            this.engine.drawings.push({
                type: "horizontal",
                price: price,
                time: time // Optional for horizontal but good to have
            });
            this.activeTool = null; // Reset tool
            this.selectedDrawingIndex = this.engine.drawings.length - 1; // Select new drawing
            this.engine.selectedDrawingIndex = this.selectedDrawingIndex; // Sync
            this.engine.eventBus.emit("drawing-update");
            return;
        }

        // For other tools, we need time
        if (!time) return;

        if (!this.isDrawing) {
            // Start drawing (Trend / Fib)
            this.isDrawing = true;
            this.currentDrawing = {
                type: this.activeTool,
                p1: { time: time, price: price },
                p2: { time: time, price: price },
            };
        } else {
            // Finish drawing
            this.isDrawing = false;
            if (this.currentDrawing) {
                this.currentDrawing.p2 = { time: time, price: price };
                this.engine.drawings.push(this.currentDrawing);
                this.currentDrawing = null;
                this.activeTool = null; // Reset tool after drawing
                this.selectedDrawingIndex = this.engine.drawings.length - 1; // Select new drawing
                this.engine.selectedDrawingIndex = this.selectedDrawingIndex; // Sync
                this.engine.eventBus.emit("drawing-update"); // Notify overlay to redraw
            }
        }
    };

    private handleMove = (param: MouseEventParams) => {
        // Handle Dragging
        if (this.isDragging && this.dragTarget && param.point) {
            let price = this.engine.candleSeries?.coordinateToPrice(param.point.y) as number;

            let time = param.time;
            if (!time && param.point) {
                const t = this.chart.timeScale().coordinateToTime(param.point.x);
                if (t !== null) time = t;
            }

            if (price && time) {
                // Apply Magnet Snap
                if (this.magnetEnabled) {
                    price = this.snapToCandle(time, price);
                }

                const d = this.engine.drawings[this.dragTarget.drawingIndex];
                // Handle Handle Dragging (Existing Logic)
                if (this.dragTarget.pointIndex >= 0) {
                    // Shift-Lock (Angle Locking)
                    if (param.sourceEvent?.shiftKey && (d.type === 'trend' || d.type === 'ray')) {
                        // ... (Shift lock logic handled below or here? Let's keep it simple for now)
                        // Re-implementing shift lock here would be good but let's stick to basic point move first
                    }

                    if (d.type === 'trend' || d.type === 'ray' || d.type === 'measure') {
                        if (this.dragTarget.pointIndex === 0) d.p1 = { time, price };
                        else d.p2 = { time, price };
                    } else if (d.type === 'fib') {
                        // Fib uses high/low or p1/p2. Let's assume p1/p2 structure for uniformity
                        if (d.p1 && d.p2) {
                            if (this.dragTarget.pointIndex === 0) d.p1 = { time, price };
                            else d.p2 = { time, price };
                        } else {
                            // Legacy support if using high/low
                            if (this.dragTarget.pointIndex === 0) d.high = { time, price }; // Assuming 0 is high/start
                            else d.low = { time, price };
                        }
                    } else if (d.type === 'horizontal') {
                        d.price = price;
                    }
                }
                this.engine.eventBus.emit("drawing-update");
            }
            return;
        }

        // Handle Body Dragging
        if (this.isDragging && this.dragTarget && this.dragTarget.pointIndex === -1 && this.dragOrigin && this.dragDrawingInitialState && param.point) {
            let price = this.engine.candleSeries?.coordinateToPrice(param.point.y) as number;
            let time = param.time;
            if (!time && param.point) {
                const t = this.chart.timeScale().coordinateToTime(param.point.x);
                if (t !== null) time = t;
            }

            if (price && time) {
                const drawing = this.engine.drawings[this.dragTarget.drawingIndex];
                const timeDelta = (time as number) - this.dragOrigin.time;
                const priceDelta = price - this.dragOrigin.price;
                const initialState = this.dragDrawingInitialState;

                if (drawing.type === 'trend' || drawing.type === 'ray' || drawing.type === 'measure') {
                    drawing.p1 = {
                        time: (initialState.p1.time as number) + timeDelta,
                        price: initialState.p1.price + priceDelta
                    };
                    drawing.p2 = {
                        time: (initialState.p2.time as number) + timeDelta,
                        price: initialState.p2.price + priceDelta
                    };
                } else if (drawing.type === 'fib') {
                    if (initialState.p1 && initialState.p2) {
                        drawing.p1 = { time: (initialState.p1.time as number) + timeDelta, price: initialState.p1.price + priceDelta };
                        drawing.p2 = { time: (initialState.p2.time as number) + timeDelta, price: initialState.p2.price + priceDelta };
                    } else {
                        drawing.high = { time: (initialState.high.time as number) + timeDelta, price: initialState.high.price + priceDelta };
                        drawing.low = { time: (initialState.low.time as number) + timeDelta, price: initialState.low.price + priceDelta };
                    }
                } else if (drawing.type === 'horizontal') {
                    drawing.price = initialState.price + priceDelta;
                }

                this.engine.eventBus.emit("drawing-update");
            }
            return;
        }

        // Handle Drawing Creation
        if (this.isDrawing && this.currentDrawing && param.point) {
            let price = this.engine.candleSeries?.coordinateToPrice(param.point.y) as number;

            let time = param.time;
            if (!time && param.point) {
                const t = this.chart.timeScale().coordinateToTime(param.point.x);
                if (t !== null) time = t;
            }

            if (price && time) {
                // Apply Magnet Snap
                if (this.magnetEnabled) {
                    price = this.snapToCandle(time, price);
                }

                // Shift-Lock (Angle Locking)
                if (param.sourceEvent?.shiftKey && (this.currentDrawing.type === 'trend' || this.currentDrawing.type === 'ray')) {
                    // Lock to horizontal, vertical, or diagonal?
                    // Horizontal is easiest and most useful.
                    // Let's check angle or delta.

                    const p1 = this.currentDrawing.p1;
                    // We need screen coordinates to calculate angle properly
                    const x1 = this.chart.timeScale().timeToCoordinate(p1.time);
                    const y1 = this.engine.candleSeries?.priceToCoordinate(p1.price);
                    const x2 = this.chart.timeScale().timeToCoordinate(time);
                    const y2 = this.engine.candleSeries?.priceToCoordinate(price);

                    if (x1 !== null && y1 !== null && y1 !== undefined && x2 !== null && y2 !== null && y2 !== undefined) {
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                        // Snap to 0, 90, 180, 270 (Horizontal/Vertical)
                        // Threshold 20 degrees
                        if (Math.abs(angle) < 20 || Math.abs(angle - 180) < 20 || Math.abs(angle + 180) < 20) {
                            // Horizontal
                            price = p1.price;
                        } else if (Math.abs(angle - 90) < 20 || Math.abs(angle + 90) < 20) {
                            // Vertical
                            time = p1.time;
                        }
                    }
                }

                this.currentDrawing.p2 = { time: time, price: price };
                // Force redraw to show active drawing line
                this.engine.eventBus.emit("drawing-update");
            }
        }

        // Handle Hover Cursor & Highlight
        if (!this.isDragging && !this.isDrawing && !this.activeTool && param.point && this.engine.container) {
            let time = param.time;
            if (!time) {
                const t = this.chart.timeScale().coordinateToTime(param.point.x);
                if (t !== null) time = t;
            }

            if (time) {
                const hit = this.hitTest(time as number, param.point.y);
                if (hit) {
                    this.engine.container.style.cursor = hit.pointIndex >= 0 ? 'grab' : 'pointer';

                    // Update Hover State
                    if (this.engine.hoveredDrawingIndex !== hit.drawingIndex) {
                        this.engine.hoveredDrawingIndex = hit.drawingIndex;
                        this.engine.eventBus.emit("drawing-update");
                    }
                } else {
                    this.engine.container.style.cursor = 'crosshair';

                    // Clear Hover State
                    if (this.engine.hoveredDrawingIndex !== null) {
                        this.engine.hoveredDrawingIndex = null;
                        this.engine.eventBus.emit("drawing-update");
                    }
                }
            }
        } else if (this.isDragging && this.engine.container) {
            this.engine.container.style.cursor = 'grabbing';
        }
    };

    enableFreeDraw() {
        // Not implemented yet
    }

    activateTool(tool: DrawingTool) {
        this.activeTool = tool;
        this.engine.chart?.applyOptions({ handleScroll: false, handleScale: false });
        this.currentDrawing = null;
    }

    enableTrendTool() {
        this.activateTool('trend');
    }

    enableHorizontalTool() {
        this.activateTool('horizontal');
    }

    enableFibTool() {
        this.activateTool('fib');
    }

    enableMeasureTool() {
        this.activateTool('measure');
    }

    addTrend(p1: any, p2: any) {
        this.engine.drawings.push({ type: "trend", p1, p2 });
        this.engine.eventBus.emit("drawing-update");
    }

    addFib(high: any, low: any) {
        this.engine.drawings.push({ type: "fib", high, low });
        this.engine.eventBus.emit("drawing-update");
    }

    clearAll() {
        this.engine.drawings = [];
        this.currentDrawing = null;
        this.isDrawing = false;
        this.activeTool = null;
        this.engine.eventBus.emit("drawing-update");
    }

    undoLastDrawing() {
        if (this.engine.drawings.length > 0) {
            this.engine.drawings.pop();
            this.engine.eventBus.emit("drawing-update");
        }
    }
}
