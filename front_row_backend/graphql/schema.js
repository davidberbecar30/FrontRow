const { buildSchema } = require('graphql')

const schema = buildSchema(`
    type Date {
        date: String!
        location: String!
        venue: String!
    }

    type Pagination {
        total: Int!
        totalPages: Int!
        currentPage: Int!
        limit: Int!
    }

    type EventsResult {
        data: [Event!]!
        pagination: Pagination!
    }

    type Statistics {
        totalEvents: Int!
        categoryBreakdown: String!
        trending: [Event!]!
        ticketsAvailability: [TicketInfo!]!
    }

    type TicketInfo {
        id: ID!
        title: String!
        availableTickets: Int!
    }

    type Event {
        id: ID!
        title: String!
        description: String!
        category: String!
        price: Float!
        availableTickets: Int!
        dates: [Date!]!
        image: String
        favorited: Boolean!
    }

    input DateInput {
        date: String!
        location: String!
        venue: String!
    }

    input EventInput {
        title: String!
        description: String!
        category: String!
        price: Float!
        availableTickets: Int!
        dates: [DateInput!]!
        image: String
    }

    type Query {
        events(page: Int, limit: Int, search: String, category: String): EventsResult!
        event(id: ID!): Event
        statistics: Statistics!
    }

    type Mutation {
        addEvent(input: EventInput!): Event!
        updateEvent(id: ID!, input: EventInput!): Event
        deleteEvent(id: ID!): Event
        toggleFavorite(id: ID!): Event
    }
`)

module.exports = schema