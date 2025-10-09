import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Auth
export const loginUser = (telegramId, username) => API.post("/auth/login", { telegramId, username });

// Subscriptions
export const getSubscription = (id) => API.get(`/subscriptions/${id}`);
export const createSubscription = (id) => API.post(`/subscriptions/${id}`);

// Referrals
export const getLeaderboard = () => API.get("/referrals/leaderboard");
export const addReferral = (inviter, invited) => API.post("/referrals/add", { inviter, invited });

export default API;
