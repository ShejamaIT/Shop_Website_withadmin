import  { createSlice} from "@reduxjs/toolkit";

const initialState = {
    cartItems : [],
    totalAmount : 0,
    totalQuantity : 0
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addItem: (state, action) => {
            const newItem = action.payload;
            const existingItem = state.cartItems.find(item => item.id === newItem.I_Id);
            state.totalQuantity++;

            if (!existingItem) {
                state.cartItems.push({
                    id: newItem.I_Id ,
                    productName: newItem.I_name,
                    imgUrl: newItem.img,
                    price: newItem.price,
                    quantity: 1,
                    totalPrice: newItem.price
                });
            } else {
                existingItem.quantity++;
                existingItem.totalPrice += Number(newItem.price);
            }

            state.totalAmount = state.cartItems.reduce(
                (total, item) => total + item.price * item.quantity, 0
            );
        },

        subtractItem: (state, action) => {
            const id = action.payload;
            const existingItem = state.cartItems.find(item => item.id === id);

            if (existingItem && existingItem.quantity > 1) {
                existingItem.quantity--;
                existingItem.totalPrice -= Number(existingItem.price);
                state.totalQuantity--;
            } else {
                state.cartItems = state.cartItems.filter(item => item.id !== id);
                state.totalQuantity -= existingItem.quantity;
            }

            state.totalAmount = state.cartItems.reduce(
                (total, item) => total + item.price * item.quantity, 0
            );
        },

        deleteItem: (state, action) => {
            const id = action.payload;
            const existingItem = state.cartItems.find(item => item.id === id);

            if (existingItem) {
                state.cartItems = state.cartItems.filter(item => item.id !== id);
                state.totalQuantity -= existingItem.quantity;
            }

            state.totalAmount = state.cartItems.reduce(
                (total, item) => total + item.price * item.quantity, 0
            );
        },
    },
});

export const cartActions = cartSlice.actions

export default cartSlice.reducer
