INSERT INTO public.cuisines (id, name)
SELECT v.id, v.name
FROM (VALUES (1, 'Polish'), (2, 'Mexican'), (3, 'Italian')) AS v(id, name)
WHERE NOT EXISTS (SELECT 1 FROM public.cuisines c WHERE c.id = v.id);

INSERT INTO public.menu_item (id, name, price)
SELECT v.id, v.name, v.price
FROM (VALUES
	 (3,'Mexican black bean lunch',21.25),
	 (1,'Apple pie',5.05),
	 (2,'Ice cream',11.55),
	 (4,'Rice salad with tuna',25.15),
	 (5,'Apple juice',3.55),
	 (8,'Beetroot and goat cheese salad',15.03),
	 (7,'Baked salmon fillet with cauliflower puree',26.58),
	 (9,'Spaghetti with cheese and pepper',15.03),
	 (6,'Orange juice',2.45),
	 (10,'Pumpkin risotto',28.53)
) AS v(id, name, price)
WHERE NOT EXISTS (SELECT 1 FROM public.menu_item m WHERE m.id = v.id);

INSERT INTO public.menu_item_type (id, name)
SELECT v.id, v.name
FROM (VALUES
	 (1,'Main course'),
	 (2,'Dessert'),
	 (3,'Drink')
) AS v(id, name)
WHERE NOT EXISTS (SELECT 1 FROM public.menu_item_type t WHERE t.id = v.id);

INSERT INTO public.addition (id, name, price)
SELECT v.id, v.name, v.price
FROM (VALUES
	 (1, 'lemon', 0.25),
	 (2, 'ice cubes', 0)
) AS v(id, name, price)
WHERE NOT EXISTS (SELECT 1 FROM public.addition a WHERE a.id = v.id);

INSERT INTO public.menu_item__addition (menu_item_id, addition_id)
SELECT v.menu_item_id, v.addition_id
FROM (VALUES
	 (5,1),
	 (5,2),
	 (6,1),
	 (6,2)
) AS v(menu_item_id, addition_id)
WHERE NOT EXISTS (
	SELECT 1 FROM public.menu_item__addition a
	WHERE a.menu_item_id = v.menu_item_id AND a.addition_id = v.addition_id
);

INSERT INTO public.menu_item__cuisine (menu_item_id, cuisine_id)
SELECT v.menu_item_id, v.cuisine_id
FROM (VALUES
	 (7,1),
	 (8,1),
	 (3,2),
	 (4,2),
	 (9,3),
	 (10,3)
) AS v(menu_item_id, cuisine_id)
WHERE NOT EXISTS (
	SELECT 1 FROM public.menu_item__cuisine c
	WHERE c.menu_item_id = v.menu_item_id AND c.cuisine_id = v.cuisine_id
);

INSERT INTO public.menu_item__menu_item_type (menu_item_id, menu_item_type_id)
SELECT v.menu_item_id, v.menu_item_type_id
FROM (VALUES
	 (1,2),
	 (2,2),
	 (3,1),
	 (4,1),
	 (5,3),
	 (6,3),
	 (7,1),
	 (8,1),
	 (9,1),
	 (10,1)
) AS v(menu_item_id, menu_item_type_id)
WHERE NOT EXISTS (
	SELECT 1 FROM public.menu_item__menu_item_type t
	WHERE t.menu_item_id = v.menu_item_id AND t.menu_item_type_id = v.menu_item_type_id
);

-- Sample orders
INSERT INTO public.orders (id, customer, status)
SELECT v.id, v.customer, v.status
FROM (VALUES
	 (1, 'John Doe', 'TO_DO'),
	 (2, 'Jane Smith', 'TO_DO')
) AS v(id, customer, status)
WHERE NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = v.id);

INSERT INTO public.order_item (id, order_id, menu_item_id, price, quantity)
SELECT v.id, v.order_id, v.menu_item_id, v.price, v.quantity
FROM (VALUES
	 (1, 1, 1, 5.05, 2),
	 (2, 1, 5, 3.55, 1),
	 (3, 2, 3, 21.25, 1),
	 (4, 2, 7, 26.58, 1)
) AS v(id, order_id, menu_item_id, price, quantity)
WHERE NOT EXISTS (SELECT 1 FROM public.order_item oi WHERE oi.id = v.id);

INSERT INTO public.addition_order_item (id, order_item_id, addition_id, price)
SELECT v.id, v.order_item_id, v.addition_id, v.price
FROM (VALUES
	 (1, 2, 1, 0.25),
	 (2, 2, 2, 0.0)
) AS v(id, order_item_id, addition_id, price)
WHERE NOT EXISTS (SELECT 1 FROM public.addition_order_item aoi WHERE aoi.id = v.id);