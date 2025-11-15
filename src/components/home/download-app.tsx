
'use client';

import Image from 'next/image';
import { Apple, Smartphone, Laptop, Monitor, Gift } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '../ui/button';

export function DownloadApp() {
    const mobileAppImage = PlaceHolderImages.find(img => img.id === 'mobile-app-view');
    const qrCodeImage = PlaceHolderImages.find(img => img.id === 'qr-code');

    return (
        <section className="py-16">
            <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex justify-center lg:justify-end">
                    {mobileAppImage && (
                        <div className="relative w-[300px] h-[600px]">
                            <Image
                                src={mobileAppImage.imageUrl}
                                alt="Fort Knox mobile app"
                                fill
                                style={{objectFit: 'contain'}}
                                className="rounded-[2.5rem] shadow-2xl"
                                data-ai-hint={mobileAppImage.imageHint}
                            />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-8 items-center lg:items-start text-center lg:text-left">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Trade on the go.
                        <br />
                        Anywhere, anytime.
                    </h2>
                    <div className="flex items-center gap-6">
                        {qrCodeImage && (
                             <Image
                                src={qrCodeImage.imageUrl}
                                alt="QR Code to download app"
                                width={128}
                                height={128}
                                className="p-2 bg-white rounded-lg shadow-md"
                                data-ai-hint={qrCodeImage.imageHint}
                            />
                        )}
                        <div>
                            <p className="font-semibold">Scan to Download App</p>
                            <p className="text-muted-foreground">iOS and Android</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-muted-foreground">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                            <Apple className="h-6 w-6" />
                            <span>MacOS</span>
                        </div>
                         <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                            <Laptop className="h-6 w-6" />
                            <span>Windows</span>
                        </div>
                         <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                            <Monitor className="h-6 w-6" />
                            <span>Linux</span>
                        </div>
                    </div>
                    <Button size="lg" className="text-lg h-14 px-8">
                        <Gift className="mr-3 h-5 w-5" />
                        Unlock Rewards
                    </Button>
                </div>
            </div>
        </section>
    );
}
