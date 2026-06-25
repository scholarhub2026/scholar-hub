import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu" // adjust import path if needed

import { Button } from "@/components/ui/button" // for triggering the dropdown

interface CustomDropdownProps {
  triggerLabel: string
  items: {
    label: string
    value: string
    onClick?: (value: string) => void
  }[]
  selectedItems?: string[]
  multiple?: boolean
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  triggerLabel,
  items,
  selectedItems = [],
  multiple = false,
}) => {
  const [selected, setSelected] = React.useState<string[]>(selectedItems)

  const handleItemClick = (value: string, onClick?: (value: string) => void) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      )
    } else {
      setSelected([value])
    }

    if (onClick) {
      onClick(value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="capitalize">
  {selected.length === 0 ? triggerLabel : multiple ? selected.join(", ") : selected[0]}
</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Select Item{multiple ? "s" : ""}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) =>
          multiple ? (
            <DropdownMenuCheckboxItem
              key={item.value}
              checked={selected.includes(item.value)}
              onCheckedChange={() => handleItemClick(item.value, item.onClick)}
            >
              {item.label}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={item.value}
              onSelect={() => handleItemClick(item.value, item.onClick)}
            >
              {item.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
