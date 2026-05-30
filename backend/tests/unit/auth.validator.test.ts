import { loginSchema, registerSchema } from '../../src/validators/auth.validator';

describe('auth validators', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      organizationName: 'Acme Inc',
      email: 'admin@acme.com',
      password: 'SecurePass1',
      firstName: 'Jane',
    });
    expect(result.success).toBe(true);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({
      organizationName: 'Acme',
      email: 'admin@acme.com',
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('accepts login payload', () => {
    const result = loginSchema.safeParse({
      email: 'user@test.com',
      password: 'any',
    });
    expect(result.success).toBe(true);
  });
});
