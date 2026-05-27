FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/Itca.Api/Itca.Api.csproj backend/Itca.Api/
RUN dotnet restore backend/Itca.Api/Itca.Api.csproj

COPY backend/Itca.Api/ backend/Itca.Api/
RUN dotnet publish backend/Itca.Api/Itca.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Itca.Api.dll"]
