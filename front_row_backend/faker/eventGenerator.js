const {faker}=require("@faker-js/faker")

const categories = ['Concert', 'Sports', 'Magic', 'Festival', 'Theater']
const venues = [
    'Madison Square Garden',
    'Crypto.com Arena',
    'Wembley Stadium',
    'Hollywood Bowl',
    'MGM Grand Garden Arena',
    'Golden 1 Center',
    'Bridgestone Arena',
    'United Center'
]
const locations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Nashville, TN',
    'Las Vegas, NV',
    'Sacramento, CA',
    'Atlanta, GA',
    'London, UK'
]

function generateFakeEvent(){
    const numDates=faker.number.int({min:1, max:4})
    const dates=Array.from({length:numDates},()=>({
        date: faker.date.future().toISOString().split("T")[0],
        location: faker.helpers.arrayElement(locations),
        venue: faker.helpers.arrayElement(venues)
    }))

    return {
        title: `${faker.person.firstName()} ${faker.helpers.arrayElement(['Tour', 'Live', 'Show', 'Concert', 'Experience'])}`,
        description: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(categories),
        price: faker.number.int({ min: 20, max: 500 }),
        availableTickets: faker.number.int({ min: 50, max: 1000 }),
        image: faker.image.url({width:640, height:480}),
        favorited: false,
        dates
    }
}
module.exports={generateFakeEvent}