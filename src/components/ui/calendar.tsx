"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row gap-8",
                month: "flex flex-col gap-4",
                month_caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-semibold text-zinc-900",
                nav: "flex items-center gap-1",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 z-10"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 z-10"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-zinc-400 mb-2",
                week: "flex w-full mt-2",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                ),
                day_button: "h-9 w-9 p-0 font-normal",
                range_start: "day-range-start bg-primary text-primary-foreground rounded-l-md rounded-r-none hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                range_end: "day-range-end bg-primary text-primary-foreground rounded-r-md rounded-l-none hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                range_middle: "day-range-middle bg-primary/10 text-primary-foreground hover:bg-primary/20 hover:text-primary-foreground aria-selected:bg-primary/10 aria-selected:text-primary rounded-none",
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                today: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-bold",
                outside: "day-outside text-zinc-400 opacity-50 aria-selected:bg-zinc-100/50 aria-selected:text-zinc-400 aria-selected:opacity-30",
                disabled: "text-zinc-400 opacity-50 cursor-not-allowed",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight
                    return <Icon className="h-4 w-4" />
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
