import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('customer not found');
    }

    const productIds = products.map(product => ({ id: product.id }));
    const foundProducts = await this.productsRepository.findAllById(productIds);

    if (foundProducts.length !== productIds.length) {
      throw new AppError('all products should be available on the database');
    }

    foundProducts.forEach((foundProduct, index) => {
      if (foundProduct.quantity < products[index].quantity) {
        throw new AppError('order with insufficient quantities');
      }
    });

    await this.productsRepository.updateQuantity(products);

    const formattedProducts = products.map((product, index) => ({
      product_id: product.id,
      price: foundProducts[index].price,
      quantity: product.quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: formattedProducts,
    });

    return order;
  }
}

export default CreateOrderService;
