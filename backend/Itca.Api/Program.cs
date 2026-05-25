var builder = WebApplication.CreateBuilder(args);

const string localNextJsCorsPolicy = "LocalNextJs";

builder.Services.Configure<SupabasePostgresOptions>(
    builder.Configuration.GetSection(SupabasePostgresOptions.SectionName)
);
builder.Services.Configure<SupabaseStorageOptions>(
    builder.Configuration.GetSection(SupabaseStorageOptions.SectionName)
);

builder.Services.AddCors(options =>
{
    options.AddPolicy(localNextJsCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors(localNextJsCorsPolicy);

app.MapGet("/api/health", () => Results.Json(new
{
    status = "ok",
    service = "ITCA API"
}));

app.Run();

public sealed class SupabasePostgresOptions
{
    public const string SectionName = "Supabase:Postgres";

    public string? ConnectionString { get; set; }
}

public sealed class SupabaseStorageOptions
{
    public const string SectionName = "Supabase:Storage";

    public string? Url { get; set; }

    public string? Bucket { get; set; }

    public string? ServiceRoleKey { get; set; }
}
