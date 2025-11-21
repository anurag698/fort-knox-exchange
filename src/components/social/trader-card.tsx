import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Copy } from "lucide-react";

interface TraderCardProps {
    trader: {
        id: string;
        name: string;
        avatar?: string;
        pnl: string;
        winRate: string;
        copiers: number;
        risk: "Low" | "Medium" | "High";
        description: string;
    };
}

export function TraderCard({ trader }: TraderCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={trader.avatar} alt={trader.name} />
                            <AvatarFallback>{trader.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold leading-none">{trader.name}</h3>
                            <Badge
                                variant="secondary"
                                className={`mt-1 text-xs ${trader.risk === "Low" ? "bg-green-500/10 text-green-500" :
                                        trader.risk === "Medium" ? "bg-yellow-500/10 text-yellow-500" :
                                            "bg-red-500/10 text-red-500"
                                    }`}
                            >
                                {trader.risk} Risk
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-green-500">{trader.pnl}</div>
                        <div className="text-xs text-muted-foreground">30d PnL</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {trader.description}
                </p>

                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-border/50">
                    <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Win Rate
                        </div>
                        <div className="font-semibold">{trader.winRate}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Users className="w-3 h-3 mr-1" />
                            Copiers
                        </div>
                        <div className="font-semibold">{trader.copiers}</div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full" variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Trader
                </Button>
            </CardFooter>
        </Card>
    );
}
