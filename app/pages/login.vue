<script setup lang="ts">
const user = useSupabaseUser();
const { auth } = useSupabaseClient();
if (user.value) {
  navigateTo('/admin');
}
const email = ref('');
const password = ref('');
const checked = ref(false);
const handleLogin = async () => {
  try {
    const a = await auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    useRouter().push('/admin');
    console.log(a);
  } catch (e) {
    console.log(e);
  }
};
definePageMeta({
  layout: 'auth',
});
</script>

<template>
  <div
    class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center h-screen w-screen erflow-hidden"
  >
    <div class="flex flex-col items-center justify-center">
      <div>
        <div
          class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20"
          style="border-radius: 53px"
        >
          <div>
            <label
              for="email1"
              class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
              >Email</label
            >
            <InputText
              id="email1"
              type="text"
              placeholder="Email address"
              class="w-full md:w-[30rem] mb-8"
              v-model="email"
            />

            <label
              for="password1"
              class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"
              >Password</label
            >
            <Password
              id="password1"
              v-model="password"
              placeholder="Password"
              :toggleMask="true"
              class="mb-4"
              fluid
              :feedback="false"
            />

            <Button
              @click="handleLogin"
              label="Sign In"
              class="w-full"
            ></Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
</style>
