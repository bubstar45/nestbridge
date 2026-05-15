import { create } from 'zustand';

export const useListingStore = create((set) => ({
  listings: [],
  selectedListing: null,
  filters: {
    mode: 'rental',
    city: '',
    state: '',
    type: '',
    min_price: '',
    max_price: '',
    beds: '',
  },
  setListings: (listings) => set({ listings }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () =>
    set({
      filters: { mode: 'rental', city: '', state: '', type: '',
                 min_price: '', max_price: '', beds: '' },
    }),
}));

export const useBookingStore = create((set) => ({
  checkIn: null,
  checkOut: null,
  guests: 1,
  setCheckIn: (date) => set({ checkIn: date }),
  setCheckOut: (date) => set({ checkOut: date }),
  setGuests: (n) => set({ guests: n }),
  reset: () => set({ checkIn: null, checkOut: null, guests: 1 }),
}));