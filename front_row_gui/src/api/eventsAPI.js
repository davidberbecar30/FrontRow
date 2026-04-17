const BASE_URL="http://localhost:3000/events"

export async function getEvents({page=1,limit=4,search="",category=""}){
    const params=new URLSearchParams()

    if(page) params.append("page",page)
    if(limit) params.append('limit',limit)
    if(search) params.append('search',search)
    if(category) params.append('category',category)

    const response=await fetch(`${BASE_URL}?${params.toString()}`)
    if(!response.ok){
        throw new Error("Failed to fetch events")
    }
    return await response.json()
}

export async function getEventById(id){
    const response=await fetch(`${BASE_URL}/${id}`)
    if(!response.ok){
        throw new Error(`Failed to fetch event with id: ${id}`)
    }
    return await response.json()
}

export async function getStatistics(){
    const response=await fetch(`${BASE_URL}/statistics`)
    if(!response.ok){
        throw new Error("Failed to fetch statistics")
    }
    return await response.json()
}

export async function addEvent(eventDetails){
    const response=await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(eventDetails)
        }
    )
    if(!response.ok){
        throw new Error("Failed to add event")
    }
    return await response.json()
}

export async function updateEvent(id,eventDetails){
    const response=await fetch(`${BASE_URL}/${id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(eventDetails)
    })

    if(!response.ok){
        throw new Error("Failed to update event")
    }
    return await response.json()
}

export async function deleteEvent(id){
    const response=await fetch(`${BASE_URL}/${id}`,{
        method:"DELETE"
    })
    if(!response.ok){
        throw new Error("Failed to delete event")
    }
    return await response.json()
}


export async function toggleFavorite(id){
    const response=await fetch(`${BASE_URL}/${id}/favorite`,{
        method:"PATCH"
    })
    if(!response.ok){
        throw new Error("Failed to toggle favorite")
    }
    return await response.json()
}