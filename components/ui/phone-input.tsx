"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"

const countries = [
  { code: "CO", dial: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "MX", dial: "+52", flag: "🇲🇽", name: "México" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "AR", dial: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "CL", dial: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "PE", dial: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "EC", dial: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "VE", dial: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "ES", dial: "+34", flag: "🇪🇸", name: "España" },
  { code: "BO", dial: "+591", flag: "🇧🇴", name: "Bolivia" },
  { code: "PY", dial: "+595", flag: "🇵🇾", name: "Paraguay" },
  { code: "UY", dial: "+598", flag: "🇺🇾", name: "Uruguay" },
  { code: "PA", dial: "+507", flag: "🇵🇦", name: "Panamá" },
  { code: "CR", dial: "+506", flag: "🇨🇷", name: "Costa Rica" },
  { code: "GT", dial: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "HN", dial: "+504", flag: "🇭🇳", name: "Honduras" },
  { code: "SV", dial: "+503", flag: "🇸🇻", name: "El Salvador" },
  { code: "NI", dial: "+505", flag: "🇳🇮", name: "Nicaragua" },
  { code: "DO", dial: "+1", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "CU", dial: "+53", flag: "🇨🇺", name: "Cuba" },
  { code: "PR", dial: "+1", flag: "🇵🇷", name: "Puerto Rico" },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  id?: string
}

export function PhoneInput({ value, onChange, placeholder = "300 123 4567", required = false, id }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]) // Colombia por defecto
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCountries = countries.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  )

  return (
    <div className="relative flex gap-0" ref={dropdownRef}>
      {/* Selector de país */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch("") }}
        className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted/50 px-2.5 py-2 text-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shrink-0"
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-muted-foreground font-medium text-xs">{selectedCountry.dial}</span>
        <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Input del número */}
      <Input
        id={id}
        type="tel"
        placeholder={placeholder}
        className="rounded-l-none border-l-0 focus-visible:ring-offset-0"
        value={value}
        onChange={(e) => {
          // Solo permitir números y espacios
          const cleaned = e.target.value.replace(/[^\d\s]/g, "")
          onChange(cleaned)
        }}
        required={required}
      />

      {/* Dropdown de países */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Buscador */}
          <div className="border-b border-border p-2">
            <input
              type="text"
              placeholder="Buscar país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          {/* Lista de países */}
          <div className="max-h-52 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code + country.dial}
                type="button"
                onClick={() => {
                  setSelectedCountry(country)
                  setIsOpen(false)
                  setSearch("")
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent ${
                  selectedCountry.code === country.code ? "bg-accent/50 font-medium" : ""
                }`}
              >
                <span className="text-base leading-none">{country.flag}</span>
                <span className="flex-1 text-left text-foreground">{country.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{country.dial}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No se encontraron países</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
