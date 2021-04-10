import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FiChevronLeft, FiHome, FiPackage, FiUser, FiShoppingCart } from 'react-icons/fi';
import { FaRegMoneyBillAlt } from 'react-icons/fa';
import MenuItem from '@components/MenuItem';

import styles from './styles.module.scss';

interface MenuProps {
  open: boolean;
  setOpen: Function;
}

const Menu: React.FC<MenuProps> = ({ open, setOpen }) => {
  const route = useRouter();
  const [selected, setSelected] = useState(route.pathname);

  // console.log(`Route? ${selected}/${route.pathname}`);

  return (
    <div className={open ? styles.menuOpen : styles.menuClosed}>
      <div className={styles.menuHeader}>
        <h1>Ozllo</h1>
        <FiChevronLeft color="#FFFFFF" size={40} onClick={() => setOpen(!open)} />
      </div>
      <MenuItem to="/dashboard" name="Home" setSelected={setSelected} iconLib={FiHome} />
      <MenuItem to="/sells" name="Minhas vendas" setSelected={setSelected} iconLib={FaRegMoneyBillAlt} />
      <MenuItem to="/orders" name="Pedidos" setSelected={setSelected} iconLib={FiShoppingCart} />
      <MenuItem to="/products" name="Produtos" setSelected={setSelected} iconLib={FiPackage} />
      <MenuItem to="/seller-register" name="Vendedor" setSelected={setSelected} iconLib={FiUser} />
    </div>
  )
}

export default Menu;
