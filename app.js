document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (event) {
        if (event.target.closest('.favorite-btn')) {
            event.preventDefault();

            const favoriteBtn = event.target.closest('.favorite-btn');
            const icon = favoriteBtn.querySelector('i');

            if (icon.textContent === '♡') {
                icon.textContent = '❤️';
                favoriteBtn.classList.add('favorite-clicked');
            } else {
                icon.textContent = '♡';
                favoriteBtn.classList.remove('favorite-clicked');
            }
        }
    });
});

document.addEventListener("alpine:init", () => {
    Alpine.data('pizzaCart', () => ({
        header: "Perfect Pizza",
        title: "Available Pizzas",
        pizzas: [],
        featuredPizzas: [],
        cartPizzas: [],
        cartTotal: 0.00,
        paymentAmount: 0,
        message: '',
        messageColor: '',
        showHistoricalOrders: false,
        historicalOrders: [],
        username: '',
        loginUsername: '',
        cardId: '',

        init() {
            this.fetchPizzas();
            this.fetchFeaturedPizzas();
            if (this.username) {
                this.createCart().then(() => {
                    this.getCart();
                }).catch(error => {
                    console.error("Error initializing cart:", error);
                });
            }
        },

        fetchPizzas() {
            axios.get('https://pizza-api.projectcodex.net/api/pizzas')
                .then(result => {
                    this.pizzas = result.data.pizzas;
                    console.log("Pizzas fetched:", this.pizzas);
                })
                .catch(error => {
                    console.error("Error fetching pizzas:", error);
                });
        },

        fetchFeaturedPizzas() {
            axios.get('https://pizza-api.projectcodex.net/api/pizzas/featured')
                .then(result => {
                    this.featuredPizzas = result.data.pizzas;
                    console.log("Featured pizzas fetched:", this.featuredPizzas);
                })
                .catch(error => {
                    console.error("Error fetching featured pizzas:", error);
                });
        },

        createCart() {
            const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
            return axios.get(createCartURL)
                .then(result => {
                    this.cardId = result.data.cart_code;
                })
                .catch(error => {
                    console.error("Error creating cart:", error);
                });
        },

        getCart() {
            if (!this.cardId) return;
            const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cardId}/get`;
            return axios.get(getCartURL)
                .then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = parseFloat(cartData.total).toFixed(2);
                    console.log("Cart data fetched:", cartData);
                })
                .catch(error => {
                    console.error("Error fetching cart data:", error);
                });
        },

        addPizzaToCart(pizzaId) {
            if (!this.cardId) return;
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                "cart_code": this.cardId,
                "pizza_id": pizzaId
            })
            .then(() => this.getCart())
            .catch(err => {
                console.error("Error adding pizza:", err);
            });
        },

        removePizzaFromCart(pizzaId) {
            if (!this.cardId) return;
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                "cart_code": this.cardId,
                "pizza_id": pizzaId
            })
            .then(() => this.getCart())
            .catch(err => {
                console.error("Error removing pizza:", err);
            });
        },

        incrementQuantity(pizzaId) {
            const pizza = this.cartPizzas.find(p => p.id === pizzaId);
            if (pizza) {
                pizza.qty++;
                this.updateCartTotal();
            }
        },

        decrementQuantity(pizzaId) {
            const pizza = this.cartPizzas.find(p => p.id === pizzaId);
            if (pizza && pizza.qty > 1) {
                pizza.qty--;
                this.updateCartTotal();
            }
        },

        updateCartTotal() {
            this.cartTotal = this.cartPizzas.reduce((total, pizza) => total + pizza.price * pizza.qty, 0);
        },

        payForCart() {
            if (this.paymentAmount >= this.cartTotal) {
                const change = this.paymentAmount - this.cartTotal;
                this.setMessage(`Payment received, your change is: R${change.toFixed(2)}`, 'orange');
                this.historicalOrders.push({
                    pizzas: this.cartPizzas.map(pizza => ({
                        flavour: pizza.name,
                        price: pizza.price,
                        qty: pizza.qty
                    })),
                    total: this.cartTotal,
                    date: new Date().toLocaleDateString(),
                    username: this.username
                });
                this.resetCart();
                this.pay(this.paymentAmount); // Confirm payment
            } else {
                this.setMessage('Insufficient funds!', 'red');
            }
        },

        setMessage(message, color) {
            this.message = message;
            this.messageColor = `bg-${color}-600`;
            setTimeout(() => this.message = '', 10000);
        },

        resetCart() {
            this.cartPizzas = [];
            this.cartTotal = 0.00;
            this.paymentAmount = 0;
        },

        toggleHistoricalOrders() {
            this.showHistoricalOrders = !this.showHistoricalOrders;
        },

        login() {
            if (this.loginUsername.trim()) {
                this.username = this.loginUsername;
                this.loginUsername = '';
                this.createCart().then(() => {
                    this.getCart();
                    this.fetchFeaturedPizzas();
                }).catch(error => {
                    console.error("Error during login:", error);
                });
            }
        },

        logout() {
            this.username = '';
            this.cardId = '';
            this.cartPizzas = [];
            this.cartTotal = 0.00;
            this.paymentAmount = 0;
            this.historicalOrders = [];
            this.featuredPizzas = [];
        }
    }));
});
