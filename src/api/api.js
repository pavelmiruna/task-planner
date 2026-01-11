import axios from "axios";

export const api = axios.create({
  baseURL: "https://task-planner-backend-hr9b.onrender.com/api",
});
