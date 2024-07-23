document.addEventListener('alpine:init', () => {
    Alpine.data('pizzaCartWithAPIWidget', function() {
        return {
            pizzas: [],
            featuredPizzas: [],
            cart: [],
            cartTotal: 0,
            paymentAmount: 0,
            checkoutMessage: '',
            orderHistory: [],

            init() {
                this.loadPizzas();
                this.loadFeaturedPizzas();
            },

            loadPizzas() {
                axios.get('http://localhost:5000/pizzas')
                    .then(response => {
                        this.pizzas = response.data;
                    });
            },

            loadFeaturedPizzas() {
                axios.get('http://localhost:5000/featured-pizzas')
                    .then(response => {
                        this.featuredPizzas = response.data;
                    });
            },

            addToCart(pizzaId) {
                axios.post('http://localhost:5000/cart', { pizzaId, action: 'add' })
                    .then(response => {
                        this.cart = response.data.cart;
                        this.cartTotal = response.data.total;
                    });
            },

            updateCart(pizzaId, action) {
                axios.post('http://localhost:5000/cart', { pizzaId, action })
                    .then(response => {
                        this.cart = response.data.cart;
                        this.cartTotal = response.data.total;
                    });
            },

            pay() {
                axios.post('http://localhost:5000/checkout', { cart: this.cart, total: this.cartTotal, payment: this.paymentAmount })
                    .then(response => {
                        this.checkoutMessage = response.data.message;
                        this.cart = [];
                        this.cartTotal = 0;
                        this.paymentAmount = 0;
                    })
                    .catch(error => {
                        this.checkoutMessage = error.response.data.message;
                    });
            },

            loadOrderHistory() {
                axios.get('http://localhost:5000/orders')
                    .then(response => {
                        this.orderHistory = response.data;
                    });
            }
        }
    });
});
