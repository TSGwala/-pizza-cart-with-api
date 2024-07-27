document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (event) {
        if (event.target.closest('.favorite-btn')) {
            event.preventDefault();

            const favoriteBtn = event.target.closest('.favorite-btn');
            const icon = favoriteBtn.querySelector('i');

            if (icon.textContent === 'favorite_border') {
                icon.textContent = 'favorite';
                favoriteBtn.classList.add('favorite-clicked');
            } else {
                icon.textContent = 'favorite_border';
                favoriteBtn.classList.remove('favorite-clicked');
            }
        }
    });
});

document.addEventListener("alpine:init", () => {
    Alpine.data('pizzaCart', () => ({
        header: "Perfect Pizza",
        title: "Shopping Cart",
        pizzas: [],
        username: '',
        cardId: '',
        cartPizzas: [],
        cartTotal: 0.00,
        paymentAmount: 0,
        message: '',
        featuredPizzas: [],
        historicalOrders: [],
        showHistoricalOrders: false,
        showHistoricalOrdersButton: false,
        messageColor: '',

        // Initialize pizzas
        pizzas: [
            { id: 1, name: 'Margherita', size: 'Small', price: 80, isFavorite: false },
            { id: 2, name: 'Pepperoni', size: 'Medium', price: 100, isFavorite: false },
            { id: 3, name: 'Hawaiian', size: 'Large', price: 120, isFavorite: false },
        ],

        // Create a new cart
        createCart() {
            const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
            return axios.get(createCartURL)
                .then(result => {
                    this.cardId = result.data.cart_code;
                }).catch(error => {
                    console.error("Error creating cart:", error);
                });
        },

        // Fetch featured pizzas
        featuredGet() {
            const featuredURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
            return axios.get(featuredURL)
                .then(result => {
                    this.featuredPizzas = result.data.pizzas;
                }).catch(error => {
                    console.error("Error fetching featured pizzas:", error);
                });
        },

        // Get cart data
        getCart() {
            const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cardId}/get`;
            return axios.get(getCartURL)
                .then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = parseFloat(cartData.total).toFixed(2);
                }).catch(error => {
                    console.error("Error getting cart data:", error);
                });
        },

        // Show cart data
        showCartData() {
            this.getCart().then(result => {
                console.log("Cart data:", result);
            });
        },

        // Add pizza to cart
        addPizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                "cart_code": this.cardId,
                "pizza_id": pizzaId
            }).then(() => true).catch(err => {
                console.error("Error adding pizza:", err);
            });
        },

        // Remove pizza from cart
        removePizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                "cart_code": this.cardId,
                "pizza_id": pizzaId
            }).catch(err => {
                console.error("Error removing pizza:", err);
            });
        },

        // Pay for the cart
        pay(amount) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                "cart_code": this.cardId,
                amount
            }).catch(err => {
                console.error("Error processing payment:", err);
            });
        },

        // Initialize the component
        init() {
            axios.get('https://pizza-api.projectcodex.net/api/pizzas')
                .then(result => {
                    this.pizzas = result.data.pizzas;
                    console.log("Pizzas fetched:", this.pizzas);
                }).catch(error => {
                    console.error("Error fetching pizzas:", error);
                });

            if (!this.cardId) {
                this.createCart().then(() => {
                    this.showCartData();
                }).catch(error => {
                    console.error("Error creating cart:", error);
                });
                this.featuredGet().then(res => {
                    this.featuredPizzas = res.data.pizzas;
                }).catch(error => {
                    console.error("Error fetching featured pizzas:", error);
                });
            }
        },

        // Add pizza to cart and update cart data
        addPizzaToCart(pizzaId) {
            this.addPizza(pizzaId)
                .then(() => {
                    this.showCartData();
                });
        },

        // Remove pizza from cart and update cart data
        removePizzaFromCart(pizzaId) {
            this.removePizza(pizzaId)
                .then(() => {
                    this.showCartData();
                });
        },

        // Record historical order
        HistoricalCart() {
            let order = {
                pizzas: [...this.cartPizzas.map(pizza => ({
                    flavour: pizza.name,
                    price: pizza.price,
                    qty: pizza.qty
                }))],
                total: parseFloat(this.cartTotal),
                date: new Date().toLocaleDateString()
            };
            this.historicalOrders.push(order);
        },

        // Handle payment and display message
        payForCart() {
            this.pay(this.paymentAmount)
                .then(result => {
                    if (result.data.status === 'failure') {
                        if (this.paymentAmount === 0) {
                            this.setMessage("Sorry - you have to put amount to pay!", 'orange');
                        } else {
                            this.setMessage(result.data.message + " Sorry - that is not enough money!", 'red');
                        }
                    } else if (result.data.status === 'success') {
                        const change = this.paymentAmount - this.cartTotal;
                        if (change >= 0) {
                            this.setMessage(`Payment received, your change is: R${change.toFixed(2)}`, 'orange');

                            this.HistoricalCart();
                            this.showHistoricalOrdersButton = true;

                            setTimeout(() => {
                                this.resetCart();
                            }, 4000);
                        } else {
                            this.setMessage('Payment received, Enjoy your Pizzas!', 'green');

                            this.HistoricalCart();
                            this.showHistoricalOrdersButton = true;

                            setTimeout(() => {
                                this.resetCart();
                            }, 4000);
                        }
                    }
                }).catch(error => {
                    console.error("Error processing payment:", error);
                });
        },

        // Set message with color and hide it after 10 seconds
        setMessage(message, color) {
            this.message = message;
            this.messageColor = `bg-${color}-600`;
            setTimeout(() => this.message = '', 10000);
        },

        // Reset cart and create a new one
        resetCart() {
            this.cartPizzas = [];
            this.cartTotal = 0.00;
            this.cardId = '';
            this.paymentAmount = 0;
            this.createCart().then(() => {
                this.showCartData();
            }).catch(error => {
                console.error("Error resetting cart:", error);
            });
        },

        // Toggle favorite status for a pizza
        toggleFavorite(id) {
            const pizza = this.pizzas.find(p => p.id === id);
            if (pizza) {
                pizza.isFavorite = !pizza.isFavorite;
            }
        },

        // Toggle visibility of historical orders
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


