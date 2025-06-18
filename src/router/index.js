import { createRouter, createWebHistory } from "vue-router";
import FoodMapView from "../views/FoodMapView.vue";
import store from '@/store'; // Import Vuex store

const routes = [
  {
    path: "/",
    name: "foodmap",
    component: FoodMapView,
    meta: { requiresAuth: true } // Add auth requirement
  },
  {
    path: "/about",
    name: "about",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: function () {
      return import(/* webpackChunkName: "about" */ "../views/AboutView.vue");
    },
    meta: { requiresAuth: true } // Add auth requirement
  },
  {
    path: "/login",
    name: "login",
    component: function () {
      return import(/* webpackChunkName: "login" */ "../views/Login.vue");
    },
    meta: { requiresAuth: false } // Explicitly no auth required
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Add authentication guard
router.beforeEach((to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Check if user is authenticated (Vuex token or localStorage token)
    const token = store.state.user.token || (localStorage.getItem("token"));
    if (token) {
      // User is authenticated, proceed
      next();
    } else {
      // Redirect to login page
      next('/login');
    }
  } else {
    // Route doesn't require authentication
    next();
  }
});

export default router;
