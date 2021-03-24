import SortBy from './SortBy';
import { useFormik } from 'formik';
import CartWidget from './CartWidget';
import Page from 'src/components/Page';
import ProductList from './ProductList';
import DrawerFilter from './DrawerFilter';
import ChipFiltered from './ChipFiltered';
import { PATH_APP } from 'src/routes/paths';
import fakeRequest from 'src/utils/fakeRequest';
import React, { useEffect, useState } from 'react';
import { HeaderDashboard } from 'src/layouts/Common';
import { useDispatch, useSelector } from 'react-redux';
import { filter, sum, includes, orderBy } from 'lodash';
import Avatar from '@material-ui/core/Avatar';
import {
  getProducts,
  sortByProducts,
  filterProducts
} from 'src/redux/slices/product';
import { makeStyles } from '@material-ui/core/styles';
import {
  Box,
  Backdrop,
  Container,
  Typography,
  CircularProgress,
  Grid
} from '@material-ui/core';

// ----------------------------------------------------------------------

const SORT_BY_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'priceDesc', label: 'Price: High-Low' },
  { value: 'priceAsc', label: 'Price: Low-High' }
];
const FILTER_GENDER_OPTIONS = ['Retailer', 'Brand', 'Delivery', 'Pick Up'];
const FILTER_CATEGORY_OPTIONS = ['All', 'Flower', 'Edibles', 'CBD'];
const FILTER_RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star'];
const FILTER_PRICE_OPTIONS = [
  { value: 'below', label: 'Below $25' },
  { value: 'between', label: 'Between $25 - $75' },
  { value: 'above', label: 'Above $75' }
];
const FILTER_COLOR_OPTIONS = [
  '#00AB55',
  '#000000',
  '#FFFFFF',
  '#FFC0CB',
  '#FF4842',
  '#1890FF',
  '#94D82D',
  '#FFC107'
];

const useStyles = makeStyles((theme) => ({
  root: {}
}));

// ----------------------------------------------------------------------

function applyFilters(products, sortBy, filters) {
  // SORT BY
  if (sortBy === 'featured') {
    products = orderBy(products, ['sold'], ['desc']);
  }
  if (sortBy === 'newest') {
    products = orderBy(products, ['createdAt'], ['desc']);
  }
  if (sortBy === 'priceDesc') {
    products = orderBy(products, ['price'], ['desc']);
  }
  if (sortBy === 'priceAsc') {
    products = orderBy(products, ['price'], ['asc']);
  }
  // FILTER PRODUCTS
  if (filters.gender.length > 0) {
    products = filter(products, (_product) => {
      return includes(filters.gender, _product.gender);
    });
  }
  if (filters.category !== 'All') {
    products = filter(products, (_product) => {
      return _product.category === filters.category;
    });
  }
  if (filters.colors.length > 0) {
    products = filter(products, (_product) => {
      return _product.colors.some((color) => filters.colors.includes(color));
    });
  }
  if (filters.priceRange) {
    products = filter(products, (_product) => {
      if (filters.priceRange === 'below') {
        return _product.price < 25;
      }
      if (filters.priceRange === 'between') {
        return _product.price >= 25 && _product.price <= 75;
      }
      return _product.price > 75;
    });
  }
  if (filters.rating) {
    products = filter(products, (_product) => {
      const convertRating = (value) => {
        if (value === 'up4Star') return 4;
        if (value === 'up3Star') return 3;
        if (value === 'up2Star') return 2;
        return 1;
      };
      return _product.totalRating > convertRating(filters.rating);
    });
  }
  return products;
}

function ShopView() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [openFilter, setOpenFilter] = useState(false);
  const { products, checkout, sortBy, filters } = useSelector(
    (state) => state.product
  );
  const totalItems = sum(checkout.cart.map((item) => item.quantity));
  const filteredProducts = applyFilters(products, sortBy, filters);

  const formik = useFormik({
    initialValues: {
      gender: filters.gender,
      category: filters.category,
      colors: filters.colors,
      priceRange: filters.priceRange,
      rating: filters.rating
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await fakeRequest(500);
        setSubmitting(false);
      } catch (error) {
        console.error(error);
        setSubmitting(false);
      }
    }
  });

  const {
    values,
    resetForm,
    handleSubmit,
    isSubmitting,
    initialValues
  } = formik;

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(filterProducts(values));
  }, [dispatch, values]);

  const handleSortBy = (value) => {
    dispatch(sortByProducts(value));
  };

  const handleOpenFilter = () => {
    setOpenFilter(true);
  };

  const handleCloseFilter = () => {
    setOpenFilter(false);
  };

  const handleResetFilter = () => {
    handleSubmit();
    resetForm();
  };

  return (
    <Page title="Dicover More" className={classes.root}>
      {values && (
        <Backdrop open={isSubmitting} sx={{ zIndex: 9999 }}>
          <CircularProgress />
        </Backdrop>
      )}

      <Container>
        <HeaderDashboard
          heading="Shop"
          links={[
            { name: 'Dashboard', href: PATH_APP.root },
            { name: 'Management', href: PATH_APP.management.root },
            {
              name: 'Discover',
              href: PATH_APP.management.eCommerce.discover
            },
            { name: 'Shop' }
          ]}
        />
        {values !== initialValues && (
          <Typography gutterBottom>
            <Typography component="span" variant="subtitle1">
              {filteredProducts.length}
            </Typography>
            &nbsp;Products found
          </Typography>
        )}

        <Box
          sx={{
            mb: 5,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            flexWrap: 'wrap-reverse'
          }}
        >
          <ChipFiltered
            filters={filters}
            formik={formik}
            isShowReset={openFilter}
            onResetFilter={handleResetFilter}
          />

          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <DrawerFilter
              formik={formik}
              genderOptions={FILTER_GENDER_OPTIONS}
              categoryOptions={FILTER_CATEGORY_OPTIONS}
              colorOptions={FILTER_COLOR_OPTIONS}
              priceOptions={FILTER_PRICE_OPTIONS}
              ratingOptions={FILTER_RATING_OPTIONS}
              isOpenFilter={openFilter}
              onResetFilter={handleResetFilter}
              onOpenFilter={handleOpenFilter}
              onCloseFilter={handleCloseFilter}
            />
            <SortBy
              sortBy={sortBy}
              onSortBy={handleSortBy}
              sortByOptions={SORT_BY_OPTIONS}
            />
          </Box>
        </Box>

        <ProductList
          products={filteredProducts}
          isLoad={!filteredProducts && !initialValues}
        />
        <CartWidget length={totalItems} />
      </Container>
    </Page>
  );
}

export default ShopView;
