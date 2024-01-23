INSERT INTO public.cuisines ("ID", "NAME") VALUES
	 ('1', 'Polish'),
	 ('2', 'Mexican'),
	 ('3', 'Italian');
	 
INSERT INTO public.menu_item ("ID","NAME","PRICE") VALUES
	 (3,'Mexican black bean lunch',21.25),
	 (1,'Apple pie',5.05),
	 (2,'Ice cream',11.55),
	 (4,'Rice salad with tuna',25.15),
	 (5,'Apple juice',3.55),
	 (8,'Beetroot and goat cheese salad',15.03),
	 (7,'Baked salmon fillet with cauliflower puree',26.58),
	 (9,'Spaghetti with cheese and pepper',15.03),
	 (6,'Orange juice',2.45),
	 (10,'Pumpkin risotto',28.53);
	 
INSERT INTO public.menu_item_type ("ID","NAME") VALUES
	 (1,'Main course'),
	 (2,'Dessert'),
	 (3,'Drink');
	 
INSERT INTO public.addition ("ID","NAME", "PRICE") VALUES
	 (1, 'lemon', 0.25),
	 (2, 'ice cubes', 0);
	 
INSERT INTO public.menu_item__addition ("MENU_ITEM_ID", "ADDITION_ID") VALUES
	 (5,1),
	 (5,2),
	 (6,1),
	 (6,2);
	 
INSERT INTO public.menu_item__cuisine ("MENU_ITEM_ID", "CUISINE_ID") VALUES
	 (7,1),
	 (8,1),
	 (3,2),
	 (4,2),
	 (9,3),
	 (10,3);
	 
INSERT INTO public.menu_item__menu_item_type ("MENU_ITEM_ID","MENU_ITEM_TYPE_ID") VALUES
	 (1,2),
	 (2,2),
	 (3,1),
	 (4,1),
	 (5,3),
	 (6,3),
	 (7,1),
	 (8,1),
	 (9,1),
	 (10,1);
	 
	 
	 
