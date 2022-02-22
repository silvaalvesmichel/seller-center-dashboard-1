import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiCameraOff, FiCheck, FiEdit, FiSearch, FiX } from 'react-icons/fi';
import { Loader } from 'src/components/Loader';
import MessageModal from 'src/components/MessageModal';
import ProductTableItem from 'src/components/ProductTableItem';
import { useAuth, User } from 'src/hooks/auth';
import { useLoading } from 'src/hooks/loading';
import { useModalMessage } from 'src/hooks/message';
import api from 'src/services/api';
import { Categories } from 'src/shared/enums/Categories';
import { Genres } from 'src/shared/enums/Genres';
import { Nationalities } from 'src/shared/enums/Nationalities';
import { Subcategories } from 'src/shared/enums/Subcategories';
import { ProductSummary as Product, Variation } from 'src/shared/types/product';
import XLSX from 'xlsx';
import BulletedButton from '../../components/BulletedButton';
import FilterInput from '../../components/FilterInput';
import styles from './styles.module.scss';

interface SearchFormData {
  search: string;
}

interface ProductsProps {
  userFromApi: User;
}

export function Products({ userFromApi }: ProductsProps) {
  const [products, setProducts] = useState([] as Product[]);
  const [items, setItems] = useState([] as Product[]);
  const [search, setSeacrh] = useState('');


  const [disabledActions, setDisableActions] = useState(false);

  const { isLoading, setLoading } = useLoading();
  const { showModalMessage: showMessage, modalMessage, handleModalMessage } = useModalMessage();

  const { token, user, updateUser } = useAuth();
  const [checked, setChecked] = React.useState(false);
  const [checkedState, setCheckedState] = useState(
    new Array(50).fill(false)
  );
  const [isDisabledAcoes, setIsDisabledAcoes] = React.useState(true);
  const [valorAcoes, setValorAcoes] = useState("");

  useEffect(() => {
    // !!userFromApi && updateUser({ ...user, shopInfo: { ...user.shopInfo, _id: userFromApi.shopInfo._id } })
  }, [userFromApi])

  // const itemsRef = useMemo(() => Array(items.length).fill(0).map(i => React.createRef<HTMLInputElement>()), [items]);

  const formRef = useRef<FormHandles>(null);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    api.get('/account/detail').then(response => {
      updateUser({ ...user, shopInfo: { ...user.shopInfo, _id: response.data.shopInfo._id } })
      setLoading(false);
      // return response.data as User;
    }).catch(err => {
      console.log(err)
      setLoading(false);
    });
  }, [])

  useEffect(() => {
    setLoading(true);

    setItems(products.filter(product => {
      return (!!product.name && (search === '' || product.name.toLowerCase().includes(search.toLowerCase())));
    }));

    setLoading(false);
  }, [search, products]);

  useEffect(() => {
    if (!!user) {
      setLoading(true);

      api.get('/product', {
        headers: {
          authorization: token,
          shop_id: user.shopInfo._id,
        }
      }).then(response => {

        let productsDto = response.data as Product[];

        productsDto = productsDto.map(product => {
          let stockCount: number = 0;

          if (!!product.variations) {
            product.variations.forEach(variation => {
              stockCount = stockCount + Number(variation.stock);
            })
          }

          product.stock = stockCount;
          product.checked = false;

          return product;
        })


        setProducts(productsDto)
        setItems(productsDto)

        setLoading(false);
      }).catch((error) => {
        console.log(error)
        setProducts([]);
        setItems([])

        setLoading(false);
      })
    }
  }, [user]);

  const handleSubmit = useCallback(
    async (data: SearchFormData) => {
      try {
        formRef.current?.setErrors({});

        if (data.search !== search) {
          setSeacrh(data.search);
        }

      } catch (err) {
        setError('Ocorreu um erro ao fazer login, cheque as credenciais.');
      }
    },
    [search],
  );

  const handleModalVisibility = useCallback(() => {
    handleModalMessage(false);
  }, [])

  const selectOrDeselectAllProducts = useCallback(async () => {
    const updatedCheckedState = checkedState.map(() => {
      return !checked;
    }
    );
    setCheckedState(updatedCheckedState);
    const updateProducts = products;
    updateProducts.forEach(produto => {
      produto.checked = !checked;
    })
    setProducts(updateProducts);

    const produtos = items;
    produtos.forEach(item => {
      item.checked = !checked;
    })
    setItems(produtos);
    setChecked(!checked);
    setIsDisabledAcoes(checked);
  }, [checked, products, items])

  const handleChange = useCallback(async (id: any, position: number) => {
    const updatedCheckedState = checkedState.map((item, index) => {
      if (index === position) {
        return !item
      }
      return item
    }
    );

    const index = products.findIndex(product => product._id === id);
    const updateProducts = products;
    updateProducts[index].checked = !checkedState[position];

    const indexItem = items.findIndex(item => item._id === id);
    const updateItems = items;
    updateItems[indexItem].checked = !checkedState[position];

    setCheckedState(updatedCheckedState);
    setProducts(updateProducts);
    setItems(updateItems);
    let isChecked = true;
    updatedCheckedState.map((item) => {
      if (item) {
        isChecked = false;
      }
    }
    );
    setIsDisabledAcoes(isChecked);

  }, [checkedState, products, items, isDisabledAcoes])

  const getVariations = (produto: any) => {
    const { variations } = produto
    return variations.map((variacao: Variation, index: number) => {

      return {
        Categoria:  getCategory(produto) ,
        Nome_do_Produto:  produto.name ,
        Marca:  produto.brand ,
        Id_agupador: variacao._id ,
        Tamanho: variacao.size ,
        Cor_ou_Sabor: variacao.color ,
        Quantidade: variacao.stock ,
        Descricao_do_Produto:  produto.description ,
        EAN:  produto.ean ,
        SKU:  produto.sku ,
        Valor_cheio:  produto.price ,
        Valor_promocional:  produto.price_discounted ,
        Altura_embalagem:  produto.height ,
        Largura_embalagem:  produto.width ,
        Comprimento_embalagem:  produto.length ,
        Peso_embalagem:  produto.weight ,
        Genero:  getGender(produto) ,
        Lactose:  produto.lactose_free ,
        Gluten:  produto.gluten_free ,
        ...getImages(produto.images),
        Id_Produto:  produto._id ,
      }
    })
  }

  const getHeader = () => {

    return {
      Categoria: "Obrigatório",
      Nome_do_Produto: "Obrigatório",
      Marca: "Obrigatório",
      Id_agupador: "Obrigatório",
      Tamanho: "Obrigatório",
      Cor_ou_Sabor: "Obrigatório",
      Quantidade: "Obrigatório",
      Descricao_do_Produto: "Obrigatório",
      EAN: "Opcional",
      SKU: "Obrigatório",
      Valor_cheio: "Obrigatório",
      Valor_promocional: "Obrigatório",
      Altura_embalagem: "Obrigatório",
      Largura_embalagem: "Obrigatório",
      Comprimento_embalagem: "Obrigatório",
      Peso_embalagem: "Obrigatório",
      Genero: "Obrigatório",
      Lactose: "Obrigatório para Alimentos",
      Gluten: "Obrigatório para alimentos",
      ...getImagesHeader(),
      Id_Produto: "Obrigatório",
    }
  }

  const getProducts = () => {
    const produtosFiltrados = items.filter(p => p.checked)
    let produtosCSV: any = []
    produtosCSV.push(getHeader())
    produtosFiltrados.forEach(produto => {
      produtosCSV = [...produtosCSV, ...getVariations(produto)]
    });
    return produtosCSV
  }

  const getGender = (produto: any) => {
    if (Genres.Masculino === produto.gender.trim()) {
      return Genres.M;
    } else if (Genres.Feminino === produto.gender.trim()) {
      return Genres.F;
    } else if (Genres.Unissex === produto.gender.trim()) {
      return Genres.U;
    }
    return "";
  }

  const getCategory = (produto: any) => {
    let nacionalidade = Nationalities[produto.nationality]; // nacionalidade
    let categoria = Categories[produto.category]; //categoria
    let subCategoria = Subcategories[produto.subcategory]; //subcategoria
    return nacionalidade + " > " + categoria + " > " + subCategoria;
  }


  const getImages = (images: any) => {
    let objetoImagem = {}
    for (let i = 0; i <= 5; i++) {
      objetoImagem = { ...objetoImagem, [`image_${i + 1}`]: images[i] ? images[i] : "" }
    }
    return objetoImagem
  }
  const getImagesHeader = () => {
    let objetoImagem = {}
    for (let i = 0; i <= 5; i++) {
      objetoImagem = { ...objetoImagem, [`image_${i + 1}`]: i <= 1 ? "Obrigatório" : "Opcional" }
    }
    return objetoImagem
  }

  const executarAcao= () => {
    if(valorAcoes === "1"){
      exportToCSV();
    }
  }

  const exportToCSV = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const csvData = getProducts();

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });

    const a = document.createElement('a');
    a.download = "Produtos.xlsx";
    a.href = URL.createObjectURL(data);
    a.addEventListener('click', (e) => {
      setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
  }


  const setValorAcao = useCallback((value) => {
    setValorAcoes(value.target.value);
  }, [valorAcoes])

  return (
    <div className={styles.productsContainer}>
      <div className={styles.productsHeader}>
        <BulletedButton
          onClick={() => { }}
          isActive>
          Meus produtos
        </BulletedButton>
        <BulletedButton
          onClick={() => { router.push('/products/create') }}>
          Criar novo produto
        </BulletedButton>
        <BulletedButton
          onClick={() => { router.push('/products/import') }}>
          Importar ou exportar
        </BulletedButton>
      </div>
      <div className={styles.divider} />
      <div className={styles.productsContent}>
        <div className={styles.productsOptions}>
          <div className={styles.contentFilters}>
            <Form ref={formRef} onSubmit={handleSubmit}>
              <FilterInput
                name="search"
                icon={FiSearch}
                placeholder="Pesquise um produto..."
                autoComplete="off" />
            </Form>
          </div>
        </div>
        <section className={styles.header}>
          <div className={styles.panelFooter}>
            <select value={valorAcoes || ""} onChange={setValorAcao} className={styles.selectOption}>
              <option selected value="0">Ação em massa</option>
              <option value="1">Exportar Produtos</option>
            </select>
            <button type='button' onClick={executarAcao} disabled={isDisabledAcoes}>Aplicar</button>
          </div>
        </section>
        <div className={styles.tableContainer}>
          {items.length > 0 ? (
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>
                    <input className={styles.checkbox}
                      type='checkbox'
                      name='todos'
                      value='todos'
                      onChange={selectOrDeselectAllProducts}
                      checked={checked}
                      key={Math.random()}
                    />
                  </th>
                  <th>Foto</th>
                  <th>Nome do produto</th>
                  <th>Marca</th>
                  <th>SKU</th>
                  <th>Valor</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <input className={styles.checkboxDados}
                        type="checkbox"
                        onChange={() => handleChange(item._id, i)}
                        checked={checkedState[i]}
                        key={item._id}
                      />
                    </td>
                    <td id={styles.imgCell} >
                      {!!item.images ? <img src={item.images[0]} alt={item.name} /> : <FiCameraOff />}
                    </td>
                    <td id={styles.nameCell}>
                      {item.name}
                    </td>
                    <td id={styles.nameCell}>
                      {item.brand}
                    </td>
                    <td id={styles.nameCell}>
                      {item.sku}
                    </td>
                    <td id={styles.valueCell}>
                      {
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }
                        ).format(item.price)
                      }
                    </td>
                    <td className={item.stock <= 0 ? styles.redText : styles.nameCell}>
                      {new Intl.NumberFormat('pt-BR').format(item.stock)}
                    </td>
                    <td>
                      <ProductTableItem
                        key={i}
                        item={item}
                        products={products}
                        setProducts={setProducts}
                        userInfo={{
                          token,
                          shop_id: !user ? '' : !!user.shopInfo._id ? user.shopInfo._id : '',
                        }}
                        disabledActions={disabledActions}
                        setDisabledActions={setDisableActions}
                      />
                    </td>
                    <td id={styles.editCell}>
                      <div onClick={() => {
                        router.push({
                          pathname: 'products/edit',
                          query: {
                            id: item._id,
                          }
                        })
                      }}>
                        <FiEdit />
                        <span> Editar </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className={styles.emptyList}> Nenhum item foi encontrado </span>
          )}
        </div>
      </div>
      {
        isLoading && (
          <div className={styles.loadingContainer}>
            <Loader />
          </div>
        )
      }
      {
        showMessage && (
          <MessageModal handleVisibility={handleModalVisibility}>
            <div className={styles.modalContent}>
              {modalMessage.type === 'success' ? <FiCheck style={{ color: 'var(--green-100)' }} /> : <FiX style={{ color: 'var(--red-100)' }} />}
              <p>{modalMessage.title}</p>
              <p>{modalMessage.message}</p>
            </div>
          </MessageModal>
        )
      }
    </div>
  )
}

export const getInitialProps = async () => {
  return ({
    props: {
    },
    revalidate: 10
  });
}

export default Products;
