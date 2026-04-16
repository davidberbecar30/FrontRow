
import {Route, Routes} from "react-router-dom";
import PresentationView from "./views/PresentationView.jsx";
import MasterView from "./views/MasterView.jsx";
import DetailView from "./views/DetailView.jsx";
import AddUpdateView from "./views/AddUpdateView.jsx";
import FavoritesView from "./views/FavoritesView.jsx";
import LoginView from "./views/LoginView.jsx";
import RegisterView from "./views/RegisterView.jsx";
import StatisticsView from "./views/StatisticsView.jsx";

function App() {
    return(
        <Routes>
            <Route path="/" element={<PresentationView/>}/>
            <Route path="/events" element={<MasterView/>}/>
            <Route path="/events/:id" element={<DetailView/>}/>
            <Route path="/events/add"  element={<AddUpdateView />}/>
            <Route path="/events/:id/edit" element={<AddUpdateView />} />
            <Route path="/favorites"   element={<FavoritesView />} />
            <Route path="/login" element={<LoginView/>}/>
            <Route path="/register" element={<RegisterView/>}/>
            <Route path="/statistics" element={<StatisticsView/>}/>
        </Routes>
    )
}

export default App;
