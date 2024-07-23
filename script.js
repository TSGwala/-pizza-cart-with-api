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
        username: 'TSGwala',
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

        pizzas: [
            { id: 1, name: 'Margherita', size: 'Small', price: 80, isFavorite: false },
            { id: 2, name: 'Pepperoni', size: 'Medium', price: 100, isFavorite: false },
            { id: 3, name: 'Hawaiian', size: 'Large', price: 120, isFavorite: false },
        ],

        createCart() {
            const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`
            return axios.get(createCartURL)
                .then(result => {
                    this.cardId = result.data.cart_code;
                });
        },

        featuredGet() {
            const featuredURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`
            return axios.get(featuredURL);
        },

        getCart() {
            const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cardId}/get`
            return axios.get(getCartURL)
        },

        showCartData() {
            this.getCart().then(result => {
                const cartData = result.data;
                this.cartPizzas = cartData.pizzas;
                this.cartTotal = parseFloat(cartData.total).toFixed(2);
            });
        },

        addPizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                "cart_code": this.cardId,
                "pizza_id": pizzaId
            }).then(() => true).catch(err => {
                console.log(err);
            });
        },

        removePizza(pizzaId) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                "cart_code": this.cardId,
                "pizza_id": pizzaId
            });
        },

        pay(amount) {
            return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                "cart_code": this.cardId,
                amount
            });
        },

        init() {
            axios.get('https://pizza-api.projectcodex.net/api/pizzas')
                .then(result => {
                    this.pizzas = result.data.pizzas;
                });

            if (!this.cardId) {
                this.createCart().then(() => {
                    this.showCartData();
                });
                this.featuredGet().then(res => {
                    this.featuredPizzas = res.data.pizzas;
                });
            }
        },

        addPizzaToCart(pizzaId) {
            this.addPizza(pizzaId)
                .then(() => {
                    this.showCartData();
                });
        },

        removePizzaFromCart(pizzaId) {
            this.removePizza(pizzaId)
                .then(() => {
                    this.showCartData();
                });
        },

        HistoricalCart() {
            let order = {
                pizzas: [...this.cartPizzas.map(pizza => ({
                    flavour: pizza.flavour,
                    price: pizza.price,
                    qty: pizza.qty
                }))],
                total: parseFloat(this.cartTotal),
                date: new Date().toLocaleDateString()
            };
            this.historicalOrders.push(order);
        },

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
                });
        },

        setMessage(message, color) {
            this.message = message;
            this.messageColor = `bg-${color}-600`;
            setTimeout(() => this.message = '', 10000);
        },

        resetCart() {
            this.cartPizzas = [];
            this.cartTotal = 0.00;
            this.cardId = '';
            this.paymentAmount = 0;
            this.createCart();
        },

        toggleFavorite(id) {
            const pizza = this.pizzas.find(p => p.id === id);
            if (pizza) {
                pizza.isFavorite = !pizza.isFavorite;
            }
        },

        toggleHistoricalOrders() {
            this.showHistoricalOrders = !this.showHistoricalOrders;
        }
    }));
});
