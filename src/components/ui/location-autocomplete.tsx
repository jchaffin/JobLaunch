"use client"

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

// Use global Google Maps types from google-maps.d.ts

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  required?: boolean;
}

export function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter location...", 
  label,
  id,
  required = false 
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);

  useEffect(() => {
    // Initialize Google Places Autocomplete Service
    const initializeGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      } else {
        // Retry after a short delay if Google Maps hasn't loaded yet
        setTimeout(initializeGoogleMaps, 500);
      }
    };
    
    initializeGoogleMaps();
  }, []);

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);

    if (!inputValue.trim() || !autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      // Use new AutocompleteSuggestion API if available
      if (window.google?.maps?.places?.AutocompleteSuggestion) {
        const request = {
          textQuery: inputValue,
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'types'],
          includedType: 'locality', // Focus on cities
          maxResultCount: 5,
          regionCode: 'US'
        };

        const response = await window.google.maps.places.AutocompleteSuggestion.searchByText(request);
        setIsLoading(false);
        
        if (response.places) {
          // Transform to match old AutocompleteService format
          const predictions = response.places.map(place => ({
            place_id: place.id,
            description: place.formattedAddress,
            structured_formatting: {
              main_text: place.displayName.text,
              secondary_text: place.formattedAddress.replace(place.displayName.text, '').trim()
            },
            types: place.types
          }));
          setSuggestions(predictions.slice(0, 5));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } 
      // Fallback to legacy AutocompleteService
      else if (autocompleteService.current) {
        const request = {
          input: inputValue,
          types: ['(cities)'],
          componentRestrictions: { country: 'us' }, // Restrict to US for now
        };

        autocompleteService.current.getPlacePredictions(request, (predictions: any, status: any) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        });
      } else {
        setIsLoading(false);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => value.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="pl-10"
        />
        <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-gray-500">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}