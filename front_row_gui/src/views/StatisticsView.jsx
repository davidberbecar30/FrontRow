import React from 'react';
import Header from "../components/Header.jsx";
import styles from './StatisticsView.module.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getEvents } from "../events/evetsList.js";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels, CategoryScale, LinearScale, BarElement);

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']

function StatisticsView() {
    const events = getEvents()

    const categoryMap = new Map()
    for (const event of events) {
        if (event.category === "Concert" || event.category === "Sports" || event.category === "Festival") {
            categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1)
        } else {
            categoryMap.set("Other", (categoryMap.get("Other") || 0) + 1)
        }
    }

    const labels = Array.from(categoryMap.keys())
    const numbers = Array.from(categoryMap.values())

    const pieData = {
        labels: labels,
        datasets: [{
            label: "No. of events",
            data: numbers,
            backgroundColor: COLORS,
            hoverOffset: 4
        }]
    }

    const pieOptions = {
        plugins: {
            legend: {
                position: 'right',
                align: 'center',
                labels: {
                    padding: 30,
                    boxWidth: 15,
                    font: { size: 18 }
                },
            },
            datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 14 },
                formatter: (value) => value,
            },
        },
        maintainAspectRatio: false
    }

    const barData = {
        labels: labels,
        datasets: [{
            label: 'Available Tickets',
            data: events.map(e => e.availableTickets),
            backgroundColor: COLORS,
        }]
    }

    const barOptions = {
        plugins: {
            legend: { display: false },
            datalabels: { display: false }
        },
        scales: {
            y: { beginAtZero: true }
        },
        maintainAspectRatio: false
    }

    const trending = [...events].sort((a, b) => b.price - a.price).slice(0, 6)

    const maxTickets = Math.max(...events.map(e => e.availableTickets))

    return (
        <div className={styles.statisticsPage}>
            <Header />

            <div className={styles.content}>
                <h1 className={styles.whatsHappening}>What's happening</h1>
                <p className={styles.description}>See what's popular and selling fast near you</p>

                <div className={styles.topRow}>

                    <div className={styles.card}>
                        <p className={styles.cardTitle}>What people are going to</p>
                        <p className={styles.cardSubtitle}>Tap a category to explore</p>
                        <div className={styles.pieDiv}>
                            <Pie data={pieData} options={pieOptions} />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <p className={styles.cardTitle}>Trending right now</p>
                        <p className={styles.cardSubtitle}>Ranked by price</p>

                        <div className={styles.trendingTable}>
                            <div className={styles.trendingHeader}>
                                <span className={styles.thNum}>#</span>
                                <span className={styles.thEvent}>Event</span>
                                <span className={styles.thCategory}>Category</span>
                                <span className={styles.thStatus}>Status</span>
                            </div>

                            {trending.map((event, i) => (
                                <div key={event.id} className={styles.trendingRow}>
                                    <span className={styles.trendingNum} style={{ color: i < 3 ? '#7B5EE8' : '#C0AEE8' }}>
                                        {i + 1}
                                    </span>
                                    <span className={styles.trendingIcon}>
                                        {event.category === 'Concert' ? '🎤' :
                                            event.category === 'Sports' ? '🏀' :
                                                event.category === 'Magic' ? '🎭' : '🎸'}
                                    </span>
                                    <div className={styles.trendingInfo}>
                                        <p className={styles.trendingTitle}>{event.title}</p>
                                        <p className={styles.trendingVenue}>
                                            {event.dates[0].venue} · {event.dates[0].date}
                                        </p>
                                    </div>
                                    <span className={styles.trendingCategory}
                                          style={{
                                              background: event.category === 'Concert' ? '#EDE8FF' :
                                                  event.category === 'Sports' ? '#E0F0FF' : '#FCE8F0',
                                              color: event.category === 'Concert' ? '#5A3AB8' :
                                                  event.category === 'Sports' ? '#1A5FA0' : '#A03060'
                                          }}>
                                        {event.category}
                                    </span>
                                    <span className={styles.trendingStatus}
                                          style={{
                                              background: event.price > 150 ? '#FFF0E8' : '#EEE8FF',
                                              color: event.price > 150 ? '#9A4A10' : '#5A3AB8'
                                          }}>
                                        {event.price > 150 ? '🔥 Selling fast' : '✨ Just added'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.bottomRow}>

                    <div className={styles.card}>
                        <p className={styles.cardTitle}>Events by category</p>
                        <p className={styles.cardSubtitle}>Total events available near you</p>
                        <div className={styles.barDiv}>
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <p className={styles.cardTitle}>Tickets still available</p>
                        <p className={styles.cardSubtitle}>How many seats are left</p>
                        <div className={styles.ticketsList}>
                            {events.map((event, index) => (
                                <div key={event.id} className={styles.ticketRow}>
                                    <span className={styles.ticketName}>
                                        {event.title.length > 18 ? event.title.slice(0, 18) + '...' : event.title}
                                    </span>
                                    <div className={styles.ticketBarBg}>
                                        <div
                                            className={styles.ticketBarFill}
                                            style={{
                                                width: `${(event.availableTickets / maxTickets) * 100}%`,
                                                background: COLORS[index % COLORS.length]
                                            }}
                                        />
                                    </div>
                                    <span className={styles.ticketCount}>~{event.availableTickets} left</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default StatisticsView