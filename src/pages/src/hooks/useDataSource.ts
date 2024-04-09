import { onMounted, reactive, ref } from 'vue';

import {
  getDataSourceList,
  getDataSourcePlugins,
  getDefaultConfig,
  getSyncRecords,
  newDataSource,
} from '@/http';
import { t } from '@/language/index';
import router from '@/router';

export const useDataSource = () => {
  const dataSourcePlugins = ref([]);
  const dataSource = ref({});
  const currentDataSourceId = ref(null);
  const isLoading = ref(false);

  onMounted(() => {
    initDataSourcePlugins();
  });

  const initDataSourcePlugins = () => {
    isLoading.value = true;
    getDataSourcePlugins().then((res) => {
      dataSourcePlugins.value = res.data;
      initDataSourceList();
    })
      .catch(() => {
        isLoading.value = false;
      });
  };

  const initDataSourceList = () => {
    getDataSourceList({ type: 'real' }).then((res) => {
      const firstData = res.data[0];
      dataSource.value = firstData;
      currentDataSourceId.value = firstData?.id ?? null;
      const index = dataSourcePlugins.value?.findIndex(item => item.id === dataSource.value?.plugin_id);
      if (index > -1) {
        dataSourcePlugins.value.unshift(...dataSourcePlugins.value.splice(index, 1));
        initSyncRecords();
      }
    })
      .finally(() => {
        isLoading.value = false;
      });
  };

  const syncStatus = ref({});
  const initSyncRecords = async () => {
    const res = await getSyncRecords({ id: currentDataSourceId.value });
    syncStatus.value = res.data?.results[0];
  };

  const handleClick = async (id: string) => {
    if (!currentDataSourceId.value) {
      if (id === 'local') {
        const res = await getDefaultConfig('local');
        newDataSource({
          plugin_id: 'local',
          plugin_config: {
            ...res.data?.config,
            enable_account_password_login: true,
          },
        }).then((res) => {
          currentDataSourceId.value = res.data?.id;
          importDialog.isShow = true;
        });
      } else {
        router.push({ name: 'newDataSource', query: { type: id } });
      }
    } else {
      router.push({ name: 'dataSourceConfig', query: id === 'local' ? {} : { type: id } });
    }
  };

  const importDialog = reactive({
    isShow: false,
    loading: false,
    title: t('导入'),
    id: 'local',
  });

  return {
    dataSourcePlugins,
    dataSource,
    currentDataSourceId,
    isLoading,
    initDataSourceList,
    syncStatus,
    initSyncRecords,
    handleClick,
    importDialog,
  };
};
