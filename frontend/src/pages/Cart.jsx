import React from "react";
import '../style/cart.css';
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import { Container, Row, Col } from "reactstrap";
import { motion } from "framer-motion";
import { cartActions } from "../redux/slices/cartSlice";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const Cart = () => {
    const cartItems = useSelector(state => state.cart.cartItems);
    const totalAmount = useSelector(state => state.cart.totalAmount);

    return (
        <Helmet title='Cart'>
            <CommonSection title='Shopping Cart' />
            <section>
                <Container>
                    <Row>
                        <Col lg={9}>
                            {cartItems.length === 0 ? (
                                <h2 className='fs-4 text-center'>No item added to the cart.</h2>
                            ) : (
                                <table className='table table-bordered'>
                                    <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th>Actions</th>
                                        <th>Total</th>
                                        <th>Delete</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {cartItems.map((item, index) => (
                                        <Tr item={item} key={index} />
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </Col>
                        <Col lg={3}>
                            <div>
                                <h6 className='d-flex align-items-center justify-content-between'>
                                    Subtotal
                                    <span className='fs-4 fw-bold'>Rs.{totalAmount}</span>
                                </h6>
                            </div>
                            <p className='fs-6 mt-2'>Taxes and shipping will be calculated at checkout.</p>
                            <div>
                                <button className='buy_btn w-100'>
                                    <Link to='/checkout'>Checkout</Link>
                                </button>
                                <button className='buy_btn w-100 mt-3'>
                                    <Link to='/shop'>Continue Shopping</Link>
                                </button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

const Tr = ({ item }) => {
    console.log(item);
    const dispatch = useDispatch();

    const deleteProduct = () => {
        dispatch(cartActions.deleteItem(item.id));
    };

    const addProducts = () => {
        dispatch(
            cartActions.addItem({
                I_Id: item.id,
                I_name: item.I_name,
                price: item.price,
                img : item.img,
            })
        );
    };

    const subtractProduct = () => {
        dispatch(cartActions.subtractItem(item.id));
    };

    return (
        <tr>
            <td><img src={item.imgUrl} alt='' style={{ width: "50px" }} /></td>
            <td>{item.productName}</td>
            <td>Rs.{item.price}</td>
            <td>{item.quantity}</td>
            <td>
                <motion.i
                    whileTap={{ scale: 1.2 }}
                    onClick={addProducts}
                    className='ri-add-line'
                ></motion.i>
                <motion.i
                    whileTap={{ scale: 1.2 }}
                    onClick={subtractProduct}
                    className='ri-subtract-line'
                ></motion.i>
            </td>
            <td>Rs.{(item.price)*(item.quantity)}</td>
            <td>
                <motion.i
                    whileTap={{ scale: 1.2 }}
                    onClick={deleteProduct}
                    className='ri-delete-bin-line'
                ></motion.i>
            </td>
        </tr>
    );
};

export default Cart;
