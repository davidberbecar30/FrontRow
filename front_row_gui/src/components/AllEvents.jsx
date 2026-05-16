
import React,{useState} from "react";

import {getEvents} from "../events/evetsList.js";
import EventCard from "./EventCard.jsx";
function AllEvents() {

    const [, forceUpdate]=useState(0);
    const events=getEvents();

    return(
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
            padding: '24px'
        }}>
            {events.map(event => (
                <EventCard
                    key={event.id}
                    event={event}
                    onFavoriteToggle={() => forceUpdate(n => n + 1)}
                />
            ))}
        </div>
    )

}

export default AllEvents;