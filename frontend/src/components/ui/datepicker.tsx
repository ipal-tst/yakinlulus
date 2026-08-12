import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DatePickerProps {
  date?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onChange, className }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <button
        className={cn(
          "w-[240px] justify-start text-left font-normal bg-background border border-border rounded-md px-3 py-2 text-sm outline-none ring-1 ring-transparent transition-colors hover:bg-muted focus:ring-ring",
          !date && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? (
          new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        ) : (
          <span>Pilih tanggal</span>
        )}
      </button>
      <PopoverContent className="w-auto p-0">
        <CalendarComponent date={date} onChange={onChange} onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

interface CalendarComponentProps {
  date?: Date
  onChange?: (date: Date | undefined) => void
  onClose: () => void
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ date, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = React.useState(date || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const weekdays = ["M", "S", "R", "K", "J", "S", "M"]

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
    onChange?.(newDate)
    onClose()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  const renderDays = () => {
    const days = []
    const daysInCurrentMonth = daysInMonth(currentDate.getFullYear(), currentDate.getMonth())
    const firstDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-md text-sm transition-colors",
            isToday(day) && "bg-primary text-primary-foreground hover:bg-primary",
            isSelected(day) && "bg-primary text-primary-foreground",
            !isSelected(day) && !isToday(day) && "hover:bg-muted"
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="h-8 w-8 p-0 hover:bg-muted rounded-md"
        >
          ←
        </button>
        <span className="font-semibold text-sm">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="h-8 w-8 p-0 hover:bg-muted rounded-md"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, i) => (
          <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  )
}

export { DatePicker }