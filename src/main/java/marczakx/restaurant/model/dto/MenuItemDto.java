package marczakx.restaurant.model.dto;

import java.util.*;

import marczakx.restaurant.model.entity.Addition;

import lombok.Builder;

@Builder
public record MenuItemDto (
    Long id,
    String name,
    Float price,
    List<Addition> additions,
    String menuItemTypeName,
    Set<Long> cuisineIds
) {}
