import { useState } from "react";
import { Input } from "@/components/ui/input";
import { countries } from "./CountrySelect";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (countryCode: string) => void;
  onPhoneChange: (phoneNumber: string) => void;
  placeholder?: string;
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  placeholder = "Phone number",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = countries.find((country) => country.code === countryCode);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and basic formatting characters
    const value = e.target.value.replace(/[^\d\s\-()]/g, "");
    onPhoneChange(value);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[140px] justify-between shrink-0"
          >
            {selectedCountry ? (
              <span className="flex items-center gap-1.5">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">Code</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-background border-border z-50" align="start">
          <Command className="bg-background">
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.name}
                    onSelect={() => {
                      onCountryChange(country.code);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        countryCode === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-lg mr-2">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {country.dialCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneChange}
        className="flex-1"
      />
    </div>
  );
}
