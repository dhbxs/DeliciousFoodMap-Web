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
    path: "/login",
    name: "login",
    component: function () {
      return import(/* webpackChunkName: "login" */ "../views/Login.vue");
    },
    meta: { requiresAuth: false } // Explicitly no auth required
  }
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

// Add authentication guard
router.beforeEach((to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Check if user is authenticated (Vuex token)
    const user = store.state.user.user;
    const token = user?.jwtToken;
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
