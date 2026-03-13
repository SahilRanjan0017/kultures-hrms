'use client';

import { Check, CreditCard, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
    {
        name: "Starter",
        price: "$0",
        description: "Perfect for small teams just getting started.",
        features: ["Up to 10 employees", "Basic leave management", "Standard payslips", "Community support"],
        button: "Current Plan",
        current: true,
    },
    {
        name: "Pro",
        price: "$49",
        description: "Advanced features for growing organizations.",
        features: ["Unlimited employees", "Automated payroll", "Advanced analytics", "Priority support", "Custom branding"],
        button: "Upgrade to Pro",
        current: false,
        highlight: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Custom solutions for large-scale operations.",
        features: ["Multi-tenant management", "SAML SSO", "Dedicated success manager", "White-glove onboarding", "Custom integrations"],
        button: "Contact Sales",
        current: false,
    },
];

export default function BillingSettingsPage() {
    return (
        <div className="space-y-8">
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" /> Early Access Benefit
                    </CardTitle>
                    <CardDescription className="text-zinc-600">
                        As an early adopter, you have full access to all features during our beta period.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`flex flex-col ${plan.highlight ? 'border-primary ring-1 ring-primary/20 shadow-lg' : 'border-zinc-200'}`}>
                        <CardHeader>
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-muted-foreground text-sm">/mo</span>}
                            </div>
                            <CardDescription className="mt-2">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <ul className="space-y-2.5 text-sm">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-zinc-600">
                                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.current ? "outline" : (plan.highlight ? "default" : "outline")}
                                disabled={plan.current}
                            >
                                {plan.button}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-zinc-500" /> Payment Methods
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                        No payment methods saved. You'll be prompted to add one when upgrading.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
