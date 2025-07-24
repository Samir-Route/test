import {Schema , model} from 'mongoose';

const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
}, {
    timestamps: true,
});

const Product = model("Product", productSchema);
export default Product;
