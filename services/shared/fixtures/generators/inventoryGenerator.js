import { faker } from '@faker-js/faker';

export function generateProducts(count = 500) {
  const categories = ['Electronics', 'Furniture', 'Office Supplies', 'Raw Materials', 'Finished Goods', 'Consumables', 'Tools & Equipment'];
  const units = ['pcs', 'box', 'set', 'kg', 'meter', 'liter', 'unit'];
  
  return Array.from({ length: count }, (_, i) => {
    const name = faker.commerce.productName();
    const category = faker.helpers.arrayElement(categories);
    const unitPrice = faker.number.int({ min: 10000, max: 10000000 });
    
    return {
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      name,
      description: faker.commerce.productDescription(),
      category,
      unit: faker.helpers.arrayElement(units),
      unitPrice,
      costPrice: faker.number.int({ min: unitPrice * 0.5, max: unitPrice * 0.8 }),
      stockQuantity: faker.number.int({ min: 0, max: 1000 }),
      reorderLevel: faker.number.int({ min: 10, max: 100 }),
      reorderQuantity: faker.number.int({ min: 50, max: 500 }),
      barcode: faker.string.numeric(13),
      weight: faker.number.float({ min: 0.1, max: 50, precision: 0.01 }),
      dimensions: `${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })} cm`,
      manufacturer: faker.company.name(),
      brand: faker.company.name(),
      isActive: faker.datatype.boolean(0.95),
      isSerialized: faker.datatype.boolean(0.1),
      tags: faker.helpers.arrayElements(['New', 'Popular', 'Sale', 'Featured', 'Limited'], { min: 0, max: 2 }),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 })
    };
  });
}

export function generateWarehouses(count = 5) {
  return Array.from({ length: count }, (_, i) => ({
    code: `WH-${String(i + 1).padStart(3, '0')}`,
    name: faker.helpers.arrayElement([
      'Main Warehouse',
      'Secondary Warehouse',
      'Distribution Center',
      'Regional Hub',
      'Transit Warehouse'
    ]) + ` ${i + 1}`,
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    province: faker.helpers.arrayElement([
      'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten'
    ]),
    postalCode: faker.location.zipCode('#####'),
    phone: `+62 21 ${faker.string.numeric(8)}`,
    manager: faker.person.fullName(),
    capacity: faker.number.int({ min: 1000, max: 10000 }),
    isActive: true,
    createdAt: faker.date.past({ years: 3 })
  }));
}

export function generateStockMovements(products, warehouses, count = 2000) {
  const movementTypes = ['PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'MANUFACTURING', 'DAMAGE'];
  
  return Array.from({ length: count }, (_, i) => {
    const product = faker.helpers.arrayElement(products);
    const warehouse = faker.helpers.arrayElement(warehouses);
    const movementType = faker.helpers.arrayElement(movementTypes);
    
    const isInbound = ['PURCHASE', 'RETURN', 'MANUFACTURING', 'ADJUSTMENT'].includes(movementType) && faker.datatype.boolean(0.7);
    const quantity = faker.number.int({ min: 1, max: 100 });
    const qtyChange = isInbound ? quantity : -quantity;
    
    const movementDate = faker.date.past({ years: 1 });
    
    return {
      movementNumber: `MOV-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      productId: product.id,
      warehouseId: warehouse.id,
      movementType,
      quantity: Math.abs(qtyChange),
      qtyChange,
      unitPrice: product.unitPrice,
      totalValue: Math.abs(qtyChange) * product.unitPrice,
      reference: `REF-${faker.string.alphanumeric(10).toUpperCase()}`,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      movementDate,
      createdAt: movementDate
    };
  });
}

export function generateStockLevels(products, warehouses) {
  const stockLevels = [];
  
  products.forEach(product => {
    warehouses.forEach(warehouse => {
      // Not all products in all warehouses
      if (faker.datatype.boolean(0.7)) {
        const quantity = faker.number.int({ min: 0, max: 500 });
        stockLevels.push({
          productId: product.id,
          warehouseId: warehouse.id,
          quantity,
          reservedQuantity: faker.number.int({ min: 0, max: quantity * 0.3 }),
          availableQuantity: quantity - faker.number.int({ min: 0, max: quantity * 0.3 }),
          lastRestockDate: faker.date.recent({ days: 60 }),
          updatedAt: faker.date.recent({ days: 7 })
        });
      }
    });
  });
  
  return stockLevels;
}

export function generateBOMs(products, count = 100) {
  const finishedGoods = products.filter(p => p.category === 'Finished Goods' || faker.datatype.boolean(0.2));
  const rawMaterials = products.filter(p => p.category === 'Raw Materials' || faker.datatype.boolean(0.3));
  
  return Array.from({ length: Math.min(count, finishedGoods.length) }, (_, i) => {
    const product = finishedGoods[i];
    const numItems = faker.number.int({ min: 2, max: 8 });
    
    const items = Array.from({ length: numItems }, () => {
      const material = faker.helpers.arrayElement(rawMaterials);
      return {
        itemId: material.id,
        itemName: material.name,
        quantity: faker.number.float({ min: 0.5, max: 10, precision: 0.01 }),
        unit: material.unit,
        scrapPercentage: faker.number.float({ min: 0, max: 5, precision: 0.1 })
      };
    });
    
    return {
      bomNumber: `BOM-${String(i + 1).padStart(5, '0')}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      items,
      isActive: faker.datatype.boolean(0.9),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 })
    };
  });
}
