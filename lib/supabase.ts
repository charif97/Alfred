// Supabase Mock Client (MVP phase)
// In a real project this requires supabase-js initialization with actual environment keys

export const supabase = {
    from: (table: string) => {
        return {
            insert: async (data: any) => {
                console.log(`Mock insert into ${table}:`, data);
                return { data, error: null };
            },
            select: (query: string) => {
                return {
                    eq: (field: string, value: any) => {
                        return {
                            single: async () => {
                                console.log(`Mock fetch from ${table} where ${field}=${value}`);
                                // Mock data return
                                return {
                                    data: {
                                        trip_data_json: {
                                            id: "mock_plan_xyz",
                                            title: "Vol direct Madrid",
                                            total_cost: 3200
                                        }
                                    },
                                    error: null
                                }
                            }
                        }
                    }
                }
            }
        };
    }
};
