<script setup>
import {  ref } from "vue"
import zhCnLocale from 'element-plus/lib/locale/lang/zh-cn';
const locale = ref(zhCnLocale)
</script>

<template>
  <el-config-provider :locale="locale">
		<router-view />
	</el-config-provider>
</template>
<style>

</style>
