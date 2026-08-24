-- Reset sequences to avoid duplicate key errors (PostgreSQL only)
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
SELECT setval('order_item_id_seq', (SELECT MAX(id) FROM order_item));
SELECT setval('addition_order_item_id_seq', (SELECT MAX(id) FROM addition_order_item));
SELECT setval('menu_item_id_seq', (SELECT MAX(id) FROM menu_item));
SELECT setval('menu_item_type_id_seq', (SELECT MAX(id) FROM menu_item_type));
SELECT setval('cuisines_id_seq', (SELECT MAX(id) FROM cuisines));
SELECT setval('addition_id_seq', (SELECT MAX(id) FROM addition));