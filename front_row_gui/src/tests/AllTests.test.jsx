import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import Header from "../components/Header.jsx";
import { MemoryRouter, Route,Routes } from "react-router-dom";
import drakeCover from "../assets/drakeCover.jpeg";
import bruno_mars from "../assets/bruno_mars.jpeg";
import EventCard from "../components/EventCard.jsx";
import * as eventsLib from "../events/evetsList.js";
import FilterComponent from "../components/FilterComponent.jsx";
import { getEvents, getEventById, getEventsByArtist, addEvent, deleteEvent, updateEvent, toggleFavorite, events } from "../events/evetsList.js";
import PresentationView from "../views/PresentationView.jsx";

const multiDateEvent = {
    id: 1,
    title: "Drake Tour",
    price: 135,
    image: drakeCover,
    availableTickets: 200,
    category: "Concert",
    description: "Experience Drake performing hits live.",
    favorited: true,
    dates: [
        { date: "2026-08-24", location: "Los Angeles, CA", venue: "Crypto.com Arena" },
        { date: "2026-09-01", location: "New York, NY", venue: "Madison Square Garden" },
        { date: "2026-09-15", location: "Chicago, IL", venue: "United Center" },
    ]
}

const singleDateEvent = {
    id: 2,
    title: "Bruno Mars",
    price: 89,
    image: bruno_mars,
    availableTickets: 150,
    category: "Concert",
    description: "An unforgettable Bruno Mars live experience.",
    favorited: false,
    dates: [
        { date: "2026-09-12", location: "Nashville, TN", venue: "Bridgestone Arena" },
    ]
}

beforeEach(() => {
    // clear and reset events array
    events.length = 0
    events.push(
        {
            id: 1,
            title: "Drake Tour",
            price: 135,
            image: drakeCover,
            availableTickets: 200,
            category: "Concert",
            description: "Experience Drake performing hits live.",
            favorited: true,
            dates: [
                { date: "2026-08-24", location: "Los Angeles, CA", venue: "Crypto.com Arena" },
                { date: "2026-09-01", location: "New York, NY", venue: "Madison Square Garden" },
                { date: "2026-09-15", location: "Chicago, IL", venue: "United Center" },
            ]
        },
        {
            id: 2,
            title: "Bruno Mars",
            price: 89,
            image: bruno_mars,
            availableTickets: 150,
            category: "Concert",
            description: "An unforgettable Bruno Mars live experience.",
            favorited: false,
            dates: [
                { date: "2026-09-12", location: "Nashville, TN", venue: "Bridgestone Arena" },
                { date: "2026-09-20", location: "Atlanta, GA", venue: "State Farm Arena" },
            ]
        }
    )
})

test('test header', ()=>{
    render(<MemoryRouter>
                <Header/>
            </MemoryRouter>)
        const element=screen.getByText('FrontRow')
        expect(element).toBeInTheDocument()
    }
)

test('rendder ButtonsHeader',()=>{
    render(<MemoryRouter>
                <Header/>
            </MemoryRouter>)
    expect(screen.getByAltText('Favorites')).toBeInTheDocument()
    expect(screen.getByAltText('Bid')).toBeInTheDocument()
    expect(screen.getByAltText('Add')).toBeInTheDocument()
    expect(screen.getByAltText('Menu')).toBeInTheDocument()
})

test('navigates to /events when logo is clicked', () => {
    render(<MemoryRouter initialEntries={['/']}>
        <Header />
    </MemoryRouter>)
    fireEvent.click(screen.getByAltText('FrontRow').closest('div'))
})

test('navigates to /favorites when favorites button is clicked', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    fireEvent.click(screen.getByAltText('Favorites').closest('button'))
})

test('navigates to /events/add when add button is clicked', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    fireEvent.click(screen.getByAltText('Add').closest('button'))
})

const renderCard = (event, onFavoriteToggle) => render(
    <MemoryRouter>
        <EventCard event={event} onFavoriteToggle={onFavoriteToggle} />
    </MemoryRouter>
)

test('test header', () => {
    render(<MemoryRouter><Header /></MemoryRouter>)
    expect(screen.getByText('FrontRow')).toBeInTheDocument()
})

test('renders title and price', () => {
    renderCard(singleDateEvent)
    expect(screen.getByText('Bruno Mars')).toBeInTheDocument()
    expect(screen.getByText('$89')).toBeInTheDocument()
})

test('renders event image with correct alt text', () => {
    renderCard(singleDateEvent)
    const img = screen.getByAltText('Bruno Mars')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', bruno_mars)
})

test('shows venue and location for single date event', () => {
    renderCard(singleDateEvent)
    expect(screen.getByText('Bridgestone Arena, Nashville, TN')).toBeInTheDocument()
})

test('shows date for single date event', () => {
    renderCard(singleDateEvent)
    expect(screen.getByText('2026-09-12')).toBeInTheDocument()
})

test('shows Multiple Locations for multi-date event', () => {
    renderCard(multiDateEvent)
    expect(screen.getByText('Multiple Locations')).toBeInTheDocument()
})

test('shows From [date] for multi-date event', () => {
    renderCard(multiDateEvent)
    expect(screen.getByText('From 2026-08-24')).toBeInTheDocument()
})

test('shows filled heart when favorited is true', () => {
    renderCard(multiDateEvent)
    expect(screen.getByRole('button')).toHaveTextContent('❤️')
})

test('shows empty heart when favorited is false', () => {
    renderCard(singleDateEvent)
    expect(screen.getByRole('button')).toHaveTextContent('🤍')
})

test('calls onFavoriteToggle when heart is clicked', () => {
    const mockUpdated = { ...singleDateEvent, favorited: true }
    vi.spyOn(eventsLib, 'toggleFavorite').mockReturnValue(mockUpdated)
    const onFavoriteToggle = vi.fn()

    renderCard(singleDateEvent, onFavoriteToggle)
    fireEvent.click(screen.getByRole('button'))

    expect(eventsLib.toggleFavorite).toHaveBeenCalledWith(singleDateEvent.id)
    expect(onFavoriteToggle).toHaveBeenCalledWith(mockUpdated)
})

test('does not call onFavoriteToggle if toggleFavorite returns null', () => {
    vi.spyOn(eventsLib, 'toggleFavorite').mockReturnValue(null)
    const onFavoriteToggle = vi.fn()

    renderCard(singleDateEvent, onFavoriteToggle)
    fireEvent.click(screen.getByRole('button'))

    expect(onFavoriteToggle).not.toHaveBeenCalled()
})

test('works without onFavoriteToggle prop', () => {
    vi.spyOn(eventsLib, 'toggleFavorite').mockReturnValue(singleDateEvent)
    expect(() => {
        renderCard(singleDateEvent)
        fireEvent.click(screen.getByRole('button'))
    }).not.toThrow()
})

test('navigates to event detail on card click', () => {
    renderCard(singleDateEvent)
    const card = screen.getByText('Bruno Mars').closest('div[class]')
    fireEvent.click(card)
})

test('renders FilterComponent labels', () => {
    render(<FilterComponent location="" search="" onLocationChange={vi.fn()} onSearchChange={vi.fn()} />)
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Dates')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
})

test('renders placeholders', () => {
    render(<FilterComponent location="" search="" onLocationChange={vi.fn()} onSearchChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Country, City, Zip Code')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('All dates')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Artist, Event, Category')).toBeInTheDocument()
})

test('renders location input with correct value', () => {
    render(<FilterComponent location="New York" search="" onLocationChange={vi.fn()} onSearchChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Country, City, Zip Code')).toHaveValue('New York')
})

test('renders search input with correct value', () => {
    render(<FilterComponent location="" search="Drake" onLocationChange={vi.fn()} onSearchChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Artist, Event, Category')).toHaveValue('Drake')
})

test('calls onLocationChange when location input changes', () => {
    const onLocationChange = vi.fn()
    render(<FilterComponent location="" search="" onLocationChange={onLocationChange} onSearchChange={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Country, City, Zip Code'), { target: { value: 'Los Angeles' } })
    expect(onLocationChange).toHaveBeenCalledWith('Los Angeles')
})

test('calls onSearchChange when search input changes', () => {
    const onSearchChange = vi.fn()
    render(<FilterComponent location="" search="" onLocationChange={vi.fn()} onSearchChange={onSearchChange} />)
    fireEvent.change(screen.getByPlaceholderText('Artist, Event, Category'), { target: { value: 'Bruno Mars' } })
    expect(onSearchChange).toHaveBeenCalledWith('Bruno Mars')
})

// --- getEvents ---
test('getEvents returns all events', () => {
    expect(getEvents().length).toBeGreaterThan(0)
})

// --- getEventById ---
test('getEventById returns correct event', () => {
    const event = getEventById(1)
    expect(event.title).toBe('Drake Tour')
})

test('getEventById returns undefined for non-existent id', () => {
    expect(getEventById(9999)).toBeUndefined()
})

// --- getEventsByArtist ---
test('getEventsByArtist returns matching events', () => {
    const results = getEventsByArtist('Bruno Mars')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toBe('Bruno Mars')
})

test('getEventsByArtist returns empty array for unknown artist', () => {
    expect(getEventsByArtist('Unknown Artist')).toHaveLength(0)
})

// --- addEvent ---
test('addEvent adds a new event to the list', () => {
    const before = getEvents().length
    addEvent({ title: 'Test Event', price: 50, dates: [] })
    expect(getEvents().length).toBe(before + 1)
})

test('addEvent assigns an id and sets favorited to false', () => {
    addEvent({ title: 'Another Event', price: 99, dates: [] })
    const added = getEvents().find(e => e.title === 'Another Event')
    expect(added.id).toBeDefined()
    expect(added.favorited).toBe(false)
})

// --- deleteEvent ---
test('deleteEvent removes the correct event', () => {
    addEvent({ title: 'To Delete', price: 10, dates: [] })
    const toDelete = getEvents().find(e => e.title === 'To Delete')
    const before = getEvents().length
    deleteEvent(toDelete.id)
    expect(getEvents().length).toBe(before - 1)
})

test('deleteEvent does nothing for non-existent id', () => {
    const before = getEvents().length
    deleteEvent(9999)
    expect(getEvents().length).toBe(before)
})

// --- updateEvent ---
test('updateEvent updates the correct event', () => {
    updateEvent(1, { title: 'Drake Updated' })
    expect(getEventById(1).title).toBe('Drake Updated')
})

test('updateEvent does nothing for non-existent id', () => {
    const before = getEvents().length
    updateEvent(9999, { title: 'Ghost' })
    expect(getEvents().length).toBe(before)
})

test('toggleFavorite toggles favorited from true to false', () => {
    const original = getEventById(1)
    const originalFavorited = original.favorited
    const result = toggleFavorite(1)
    expect(result.favorited).toBe(!originalFavorited)
})

test('presView',()=>{
    render(<MemoryRouter><PresentationView/></MemoryRouter>)
    expect(screen.getByText('FrontRow')).toBeInTheDocument()
    expect(screen.getByText('Your front row seats to the best events.')).toBeInTheDocument()
    expect(screen.getByText('Discover concerts, festivals, and live events near you. Book tickets instantly and never miss an unforgettable moment.')).toBeInTheDocument()
})

test('renders images', () => {
    render(<MemoryRouter><PresentationView /></MemoryRouter>)
    expect(screen.getByAltText('photo1')).toBeInTheDocument()
    expect(screen.getByAltText('photo2')).toBeInTheDocument()
    expect(screen.getByAltText('FrontRow logo')).toBeInTheDocument()
})

test('renders Browse events, Log In and Register buttons', () => {
    render(<MemoryRouter><PresentationView /></MemoryRouter>)
    expect(screen.getByText('Browse events')).toBeInTheDocument()
    expect(screen.getByText('Log In')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
})

test('clicking Browse events navigates to /events', () => {
    render(<MemoryRouter><PresentationView /></MemoryRouter>)
    fireEvent.click(screen.getByText('Browse events'))
})

test('clicking Log In navigates to /login', () => {
    render(<MemoryRouter><PresentationView /></MemoryRouter>)
    fireEvent.click(screen.getByText('Log In'))
})

test('clicking Register navigates to /register', () => {
    render(<MemoryRouter><PresentationView /></MemoryRouter>)
    fireEvent.click(screen.getByText('Register'))
})

import AddUpdateView from "../views/AddUpdateView.jsx";
import DetailView from "../views/DetailView.jsx";
import MasterView from "../views/MasterView.jsx";

// ─── AddUpdateView ───────────────────────────────────────

test('AddUpdateView renders ADD EVENT title', () => {
    render(<MemoryRouter initialEntries={['/events/add']}><AddUpdateView /></MemoryRouter>)
    expect(screen.getByText('ADD EVENT')).toBeInTheDocument()
})

test('AddUpdateView renders all field labels', () => {
    render(<MemoryRouter initialEntries={['/events/add']}><AddUpdateView /></MemoryRouter>)
    expect(screen.getByText('Event Name')).toBeInTheDocument()
    expect(screen.getByText('Event Description')).toBeInTheDocument()
    expect(screen.getByText('Event Locations and Dates')).toBeInTheDocument()
    expect(screen.getByText('Available Tickets')).toBeInTheDocument()
    expect(screen.getByText('Base Price')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Event Image')).toBeInTheDocument()
})

test('AddUpdateView shows validation errors when submitting empty form', () => {
    render(<MemoryRouter initialEntries={['/events/add']}><AddUpdateView /></MemoryRouter>)
    fireEvent.click(screen.getByText('Finish'))
    expect(screen.getByText('Event name is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(screen.getByText('At least one location and date is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid number of tickets')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid price')).toBeInTheDocument()
})

test('AddUpdateView fills and submits form successfully', () => {
    render(<MemoryRouter initialEntries={['/events/add']}><AddUpdateView /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText("Enter event's name"), { target: { value: 'Test Event' } })
    fireEvent.change(screen.getByPlaceholderText("Enter event's description"), { target: { value: 'Test Description' } })
    fireEvent.change(screen.getByPlaceholderText(/Location;Venue;Date/), { target: { value: 'London;Wembley;2026-08-08' } })
    fireEvent.change(screen.getByPlaceholderText('Eg: 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Eg: 50'), { target: { value: '50' } })
    fireEvent.click(screen.getByText('Finish'))
    // no validation errors = form was valid
    expect(screen.queryByText('Event name is required')).not.toBeInTheDocument()
})

test('AddUpdateView renders UPDATE EVENT title when editing', () => {
    render(
        <MemoryRouter initialEntries={['/events/1/edit']}>
            <Routes>
                <Route path="/events/:id/edit" element={<AddUpdateView />} />
            </Routes>
        </MemoryRouter>
    )
    expect(screen.getByText('UPDATE EVENT')).toBeInTheDocument()
})

test('AddUpdateView cancel button navigates away', () => {
    render(<MemoryRouter initialEntries={['/events/add']}><AddUpdateView /></MemoryRouter>)
    fireEvent.click(screen.getByText('Cancel'))
})

// ─── DetailView ───────────────────────────────────────────

test('DetailView renders event not found for invalid id', () => {
    render(
        <MemoryRouter initialEntries={['/events/9999']}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    expect(screen.getByText('Event not found.')).toBeInTheDocument()
})

// test('DetailView renders event title and description', () => {
//     render(
//         <MemoryRouter initialEntries={['/events/1']}>
//             <Routes>
//                 <Route path="/events/:id" element={<DetailView />} />
//             </Routes>
//         </MemoryRouter>
//     )
//     expect(screen.getByText('Drake Tour')).toBeInTheDocument()
//     expect(screen.getByText('Experience Drake performing hits live.')).toBeInTheDocument()
// })

test('DetailView renders BUY NOW buttons for each date', () => {
    render(
        <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    const buyBtns = screen.getAllByText('BUY NOW!')
    expect(buyBtns.length).toBe(3) // Drake has 3 dates
})

test('DetailView increment and decrement quantity', () => {
    render(
        <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    const incrementBtns = screen.getAllByText('+')
    const decrementBtns = screen.getAllByText('−')
    fireEvent.click(incrementBtns[0])
    fireEvent.click(incrementBtns[0])
    fireEvent.click(decrementBtns[0])
    // quantity should now be 2
    expect(screen.getAllByText('2')[0]).toBeInTheDocument()
})

test('DetailView decrement does not go below 1', () => {
    render(
        <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    const decrementBtns = screen.getAllByText('−')
    fireEvent.click(decrementBtns[0])
    fireEvent.click(decrementBtns[0])
    expect(screen.getAllByText('1')[0]).toBeInTheDocument()
})

test('DetailView favorite button toggles', () => {
    render(
        <MemoryRouter initialEntries={['/events/2']}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    const favBtn = screen.getByRole('button', { name: /❤️|🤍/ })
    fireEvent.click(favBtn)
})

test('DetailView delete button works', () => {
    addEvent({ title: 'To Delete View', price: 10, dates: [{ date: '2026-01-01', location: 'NY', venue: 'MSG' }], availableTickets: 10, category: 'Test' })
    const toDelete = getEvents().find(e => e.title === 'To Delete View')
    render(
        <MemoryRouter initialEntries={[`/events/${toDelete.id}`]}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    fireEvent.click(screen.getByText('[Delete]'))
})

test('DetailView update button navigates to edit', () => {
    render(
        <MemoryRouter initialEntries={['/events/1']}>
            <Routes>
                <Route path="/events/:id" element={<DetailView />} />
            </Routes>
        </MemoryRouter>
    )
    fireEvent.click(screen.getByText('[Update]'))
})

// ─── MasterView ───────────────────────────────────────────

test('MasterView renders Picked for you section', () => {
    render(<MemoryRouter><MasterView /></MemoryRouter>)
    expect(screen.getByText('🎭 Picked for you')).toBeInTheDocument()
})

test('MasterView renders category pills', () => {
    render(<MemoryRouter><MasterView /></MemoryRouter>)
    expect(screen.getByText('🔥 Hype')).toBeInTheDocument()
    expect(screen.getByText('🧘 Chill')).toBeInTheDocument()
    expect(screen.getByText('💗 Date')).toBeInTheDocument()
    expect(screen.getByText('🏆 Sports')).toBeInTheDocument()
})

test('MasterView category pill click changes active pill', () => {
    render(<MemoryRouter><MasterView /></MemoryRouter>)
    fireEvent.click(screen.getByText('🧘 Chill'))
})

test('MasterView search filters events', () => {
    render(<MemoryRouter><MasterView /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('Artist, Event, Category'), { target: { value: 'Drake' } })
    expect(screen.getAllByText('Drake Tour')[0]).toBeInTheDocument()
})

test('MasterView renders Vibe Match badge', () => {
    render(<MemoryRouter><MasterView /></MemoryRouter>)
    expect(screen.getByText('Vibe Match')).toBe
})

