import Cookies from 'js-cookie';

const RECENTLY_VIEWED_KEY='recentlyViewed';
const FAVORITES_KEY = 'favoritedEvents'
const CATEGORY_CLICKS_KEY = 'categoryClicks'

export function getRecentlyViewed(){
    const data=Cookies.get(RECENTLY_VIEWED_KEY);
    return data ? JSON.parse(data) : [];
}

export function addRecentlyViewed(event){
    let recent=getRecentlyViewed();
    recent=recent.filter(e=>e.id!==event.id);
    recent.unshift({ id: event.id, title: event.title, price: event.price, image: event.image })
    recent = recent.slice(0, 3)
    Cookies.set(RECENTLY_VIEWED_KEY, JSON.stringify(recent),{expires:1});
}

export function getFavorites(){
    const data=Cookies.get(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
}

export function addFavorite(event){
    let favorites=getFavorites();
    favorites=favorites.filter(e=>e.id!==event.id);
    favorites.unshift({ id: event.id, title: event.title, price: event.price, image: event.image })
    Cookies.set(FAVORITES_KEY, JSON.stringify(favorites),{expires:1});
}

export function trackCategoryClick(category) {
    const data = Cookies.get(CATEGORY_CLICKS_KEY)
    const clicks = data ? JSON.parse(data) : {}
    clicks[category] = (clicks[category] || 0) + 1
    Cookies.set(CATEGORY_CLICKS_KEY, JSON.stringify(clicks), { expires: 7 })
}

export function getMostClickedCategory() {
    const data = Cookies.get(CATEGORY_CLICKS_KEY)
    if (!data) return null
    const clicks = JSON.parse(data)
    if (Object.keys(clicks).length === 0) return null
    return Object.entries(clicks).sort((a, b) => b[1] - a[1])[0][0]
}