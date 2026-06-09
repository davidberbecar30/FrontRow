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

// Curated Unsplash CDN photos per category — permanent, no API key needed
const U = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=500&fit=crop&auto=format&q=80`

const CATEGORY_IMAGES = {
    Concert: [
        U('1540039155633-e07f1bf5d3e1'),  // concert crowd + stage lights
        U('1501386761578-eac207ef06b3'),  // live music energy
        U('1470229722913-7c0e2dbbafd3'),  // stage performance
        U('1493676304819-0d7a8d026dcf'),  // colorful concert
        U('1524368535928-5b5e00ddc76b'),  // dramatic stage
    ],
    Sports: [
        U('1546519638-68e109498ffc'),  // basketball arena
        U('1508098682722-e99c643e7f0b'),  // stadium crowd
        U('1574629810360-7efbbe195018'),  // soccer match
        U('1587280501635-68a0e82cd5ff'),  // sports action
        U('1517466787-579ba2b6b75b'),  // outdoor sports
    ],
    Festival: [
        U('1533174072545-7a4b6ad7a6c3'),  // festival crowd sunset
        U('1492684223066-81342ee5ff30'),  // festival night lights
        U('1429962714451-bb934ecdc4ec'),  // outdoor music festival
        U('1459749411175-04bf5292ceea'),  // festival stage lights
        U('1506157786151-b8491531f063'),  // festival crowd energy
    ],
    Theater: [
        U('1507676184212-d03ab07a01bf'),  // theater stage
        U('1518893883800-45cd0954574b'),  // dramatic stage performance
        U('1460723237483-7a6dc9d0b212'),  // theater interior
        U('1578946956088-940c3b502864'),  // performance art
        U('1503095396549-807753d3fb2c'),  // stage spotlight
    ],
    Magic: [
        U('1516450360452-9312f5e86fc7'),  // magic performance
        U('1478720568477-152d9b164e26'),  // mysterious atmosphere
        U('1499364615650-ec38552f4f34'),  // dark mysterious
        U('1558618666-fcd25c85cd64'),  // illusion/magic
        U('1567360425852-56cb500a31e3'),  // dramatic performance
    ]
}

function pickImage(category) {
    const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.Concert
    return faker.helpers.arrayElement(images)
}

function generateFakeEvent(){
    const category = faker.helpers.arrayElement(categories)
    const numDates=faker.number.int({min:1, max:4})
    const dates=Array.from({length:numDates},()=>({
        date: faker.date.future().toISOString().split("T")[0],
        location: faker.helpers.arrayElement(locations),
        venue: faker.helpers.arrayElement(venues),
        availableTickets: faker.number.int({ min: 50, max: 1000 })
    }))

    return {
        title: `${faker.person.firstName()} ${faker.helpers.arrayElement(['Tour', 'Live', 'Show', 'Concert', 'Experience'])}`,
        description: faker.lorem.sentence(),
        category,
        price: faker.number.int({ min: 20, max: 500 }),
        availableTickets: faker.number.int({ min: 50, max: 1000 }),
        image: pickImage(category),
        favorited: false,
        dates
    }
}

module.exports = { generateFakeEvent, CATEGORY_IMAGES, pickImage }
